---
sidebar_position: 3
---

# 5-3 计算区块热量

## 过热、冷却和计时器

我们在上一节已经介绍了实现热量计算的基本思路：

- 当有实体生成时，**增加**区块的热量值。
- 当热量值**超出**某个限定值时，在一段冷却时间内，阻止新实体生成。
- 在冷却时间过后，**重置**区块热量值，并重新开始计算。

这看上去很简单，但是如果各位读者再仔细想想，就会发现下面这个问题：

> Nyaci：要怎么计算“一段冷却时间”呢？插件要怎么知道，距离这个区块**上一次过热**以来，过了多久呢？

前面我们已经提到过，我们可以用 PDC 来存储区块的热量值，那么同样地，我们也可以使用 PDC 来存储区块**距离上一次过热以来过了多久**。每当有实体创建时，我们就看看当前时间相比上一次过热是不是**过去了足够久**。这个“足够久”是多少呢？就是区块的冷却时间，即配置文件中 `cooldown` 的值。

用**伪代码**来描述就是这样：

```kotlin
if (now - chunk.lastOverheatTime >= cooldown) {
    // 区块已经冷却了，允许实体生成，正常计算热量
} else {
    // 区块还没冷却，阻止实体生成
}
```

:::tip 术语库

**伪代码（Pseudo Code）** 是写给普通人看的代码。伪代码通常不关注属性和方法的具体名字，也不一定遵循语法规则，只是以最简单的方式**描述程序的功能**。

:::

这就是在事件驱动编程中计算时间的方法！读者可能会问，为什么不像 C 语言那样，直接让事件处理函数**等待一段时间**，然后重置热量值呢？这不是更简单吗：

```kotlin
if (heat > limit) {
    sleep(cooldown)
    heat = 0
}
```

但问题在于，事件处理函数是**绝不能等待**的，事件处理函数由 Bukkit 在每个游戏刻的合适时刻运行，它必须**在这个游戏刻内**完成自身的工作。也就是说，事件处理函数必须**尽可能快**。如果像上面这样用 `sleep` 直接在事件处理函数里面进行等待，那么服务器就会卡住，直到事件处理函数的等待完成。玩家碰到了这样的情况，回头就会说，“哎呀，这什么破烂服务器，稍微多刷新一点实体，整个服务器就卡死半个小时，这还怎么玩嘛！”这可不是我们想看到的结果。

因此，事件处理函数不能跟踪区块冷却的全过程，所以它只能在区块上**打一个标记**，写着“此区块在 XXX 时过热过”，然后它就把这件事忘掉。下一次再碰到这个区块时，它只需要读取这个标记，就知道是否已经过去了足够长的时间。

那么，要如何**重置热量**呢？也许你的第一想法是，在第一次发现区块冷却之后，就将热量值重置为 0，但是这样做比较麻烦，因为我们需要判断热量值**是否已经重置过了**，这需要在 PDC 中再增加一项条目，这是比较麻烦的。

相反，我们可以**在过热之后就立即将热量设置为 0**，由于在整个过热冷却期间，事件处理函数只是简单地阻止新实体生成，并不会用到热量值，所以在冷却前将热量设置为 0，就不用再费尽心思去想“这个值到底有没有重设过”了。这么做尽管有点违背直觉，不过代码上更加方便。

把重置热量的伪代码和前面的计时伪代码结合在一起，就得到整个事件处理函数的伪代码：

```kotlin
if (now - chunk.lastOverheatTime >= cooldown) {
    // 区块已经冷却了，允许实体生成，正常计算热量
    heat = heat + 1
    if (heat >= limit) {    // 发现过热
        chunk.lastOverheatTime = now    // 记录最近一次过热的时间（也就是现在）
        heat = 0                        // 过热的瞬间就重设热量，而不要等到冷却之后
    }
} else {
    // 区块还没冷却，阻止实体生成
}
```

好，下面我们就把这些伪代码转换为 Kotlin 代码。

## 判断实体类型

我们把目光挪到上一节添加的 `onMobSpawn` 方法中，这是事件处理的地方。我们首先从接收到的 `EntitySpawnEvent` 开始，第一步要做的是**判断生成的实体是否应该被限制**，即出现在配置文件的 `mobs` 列表中：

```kotlin
val entities = config.getStringList("mobs")
if (!entities.contains(ev.entity.type.key.toString())) return
```

`getStringList` 方法从 YAML 配置中获取一个**字符串列表**，也就是一组字符串，这与我们配置文件中 `mobs` 的类型相对应。`getStringList` 返回的类型是 `List<String>`，`<>` 的含义可以简单理解为“装着”，即“装着 `String` 的 `List`”。

`mobs` 键中的字符串都是**命名空间 ID**，所以相对的，我们要获取新生成实体的**类型**，并将这个类型也转换成命名空间 ID，这是通过一连串属性访问（实际上是 Getter 调用）得到的：

```kotlin
ev.entity       // 获取所生成的实体对象
  .type         // 获取类型信息
  .key          // 获取类型信息所对应的命名空间 ID（即 Namespaced Key）
  .toString()   // 转换为字符串
```

`type` 的类型是 `EntityType`，用来表示实体类型的一个中间结构，它的 `key` 属性（对应 Java 中的 `getKey` 方法）获得这个类型对应的命名空间 ID，例如 `minecraft:zombie`。由于命名空间 ID 本身也是用 Bukkit 的一种内部格式（而不是字符串）表示的，因此我们还需要使用 `toString` 方法将它转换成字符串，才能与 `getStringList` 的结果进行比对。

`List` 接口提供一个 `contains` 方法，用来检测**给定的值是否在列表中**，所以使用 `entites.contains(...)` 就能知道当前所生成的实体类型是否是管理员想要限制的类型**之一**。和上一节中提到的一样，为了避免 `if` 后跟随的 `{}` 过长，我们使用 `return` 表达式，在实体类型不匹配的时候**直接离开函数**。

## 访问区块的 PDC

在获取了实体后，我们就可以通过 `Entity` 类的 `chunk` 属性获得实体所在的区块，并进而使用其下的 `persistentDataContainer` 属性获得该区块的 PDC，随后我们就可以在这里存储热量和冷却时间数据。

```kotlin
val chunk = ev.entity.chunk
```

前面已经提到，要在 PDC 中存取数据，就必须拥有对应的**键** —— 你可以理解成钥匙。PDC 所使用的键同样是命名空间 ID，但它不是简单的字符串，而要通过下面这样的方法构造：

```kotlin
val heatKey = NamespacedKey.fromString("chunk_heat:heat")!!
val lastOverheatTimeKey = NamespacedKey.fromString("chunk_heat:last_overheat")!!
```

我们创建了两把“钥匙”，对应的键分别是 `chunk_heat:heat`（存储热量值）和 `chunk_heat:last_overheat`（最近一次过热的刻数）。`fromString` 方法将我们提供的字符串转换成一个 `NamespacedKey` 对象。

在方法调用的最后，我们增加了 `!!`，这是**非 `null` 断言符号**，告诉 Kotlin“如果 `fromString` 返回 `null` 的话，那怎样都好了！”，这是因为 `fromString` 在所提供的字符串不是合法的命名空间 ID 时会返回 `null`，但我们这里提供的是字符串字面量，我们已经知道 `chunk_heat:heat` 绝对是一个有效的命名空间 ID，所以我们可以放心大胆地使用 `!!` 来声明：“这绝对不是 `null`！”

现在我们用这两个键来获取对应的值，即区块当前的热量值和最近一次过热的时间：

```kotlin
val prevHeat = chunk.persistentDataContainer.get(heatKey, PersistentDataType.INTEGER) ?: 0
val lastOverheatTime = chunk.persistentDataContainer.get(lastOverheatTimeKey, PersistentDataType.INTEGER) ?: 0
```

PDC 对象通过 `persistentDataContainer` 属性来获取，它的 `get` 方法返回指定的键对应的值，第二个参数则指定值的类型。`get` 方法会自动将返回值类型**设置得与指定的类型相同**，这里我们提供 `PersistentDataType.INTEGER` 作为类型，那么 `get` 就会返回 `Int`。

`get` 调用后跟随的 `?:` 运算符你已经见过了，它在左侧的值是 `null` 的时候使用右侧的值作为默认值。PDC 的 `get` 方法在找不到对应的值时会返回 `null`，我们通过 `?:` 运算符告诉 Kotlin：“如果这个值是 `null` 的话，那就用 `0` 代替好了！”

## 过热逻辑

在获取了区块中所存储的**最近一次过热时间**和**当前热量**后，我们就可以编写代码来完成热量计算和阻止实体生成的逻辑了。

第一步要做的是，如果发现区块还在冷却中，就**取消实体生成事件**，从而阻止实体生成：

```kotlin
if (Bukkit.getCurrentTick() < lastOverheatTime + config.getInt("cooldown")) {
    ev.isCancelled = true
    return
}
```

`Bukkit.getCurrentTick` 方法获得服务器**自启动以来经过的刻数**，我们把它当作当前时间。上面的代码判断当前时间是否早于最近过热时间加上冷却时间，也就是区块当前是否还在冷却中。如果区块还在冷却，就把 `isCancelled` 属性设置为 `false`，并离开事件处理函数。

接下来，我们只需要考虑“区块不在冷却中”的情况：

```kotlin
val newHeat = prevHeat + 1
if (newHeat >= config.getInt("overheat")) {
    // 记录过热时间
    chunk.persistentDataContainer.set(
        lastOverheatTimeKey,
        PersistentDataType.INTEGER,
        Bukkit.getCurrentTick()
    )

    // 设置热量为 0
    chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, 0)
} else {
    // 更新热量值
    chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, newHeat)
}
```

我们首先计算新的热量值 `newHeat`，然后将它与配置文件中设定的界限 `overheat` 进行比对，如果超出限定值的话，说明区块在这次实体生成的时候过热了，那么我们就记录下当前的刻数，将热量值重置为 `0`，否则，区块还没有过热，但是距离过热“更近了一步”，所以我们将新的热量值重新记录回去。

这些数据的记录是通过 PDC 的 `set` 方法完成的，`set` 方法和 `get` 很像，不过多了第三个参数，是要写入到 PDC 中的值。

---

这样，插件的主要代码功能就完成了！大家现在肯定很激动，不过笔者不得不在这里泼一盆冷水了（笑），上面的代码虽然“差不多能运行”，但实际上存在两个漏洞，而且也有一些可以优化的地方，我们在下一节中讨论这个问题。