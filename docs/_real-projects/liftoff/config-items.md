---
sidebar_position: 7
---


# LT-4 读写配置文件（下）

现在让我们回到项目中来。

## 读取物品配置（续）

我们已经知道，可以使用 `getList` 来获取某个键对应的列表值：

```kotlin
val kitItems = config.getList("kit-content", emptyList<ItemStack>())!! as List<ItemStack>
```

`emptyList<T>` 创建一个元素类型为 `T` 的空白（只读）列表 `List<T>`。

*虽然空白的列表理论上不含任何东西，但由于它实现了 `List<T>`，从代码的角度上来说还是需要一个类型的，而 Kotlin 在这里又无法自动推断，因此我们需要手动指定。*

`getList` 顾名思义，返回一个 `List`。细心的读者肯定要问了，`List` 是一个泛型类，`getList` 返回的 `List` 元素类型是什么呢？如果你用 IDEA 查看，你会发现返回值类型是 `List<?>`，也就是 `List<Any?>`。难道这是说 `getList` 返回一个类型全是 `Any?` 的元素吗？如果真是那样，`getList` 未免也太偷懒了。

其实，`getList` 并没有做错什么，它返回一个列表，其中每个元素是**它在 YAML 中的数据类型**，也就是说，如果有这样的 YAML 列表：

```yaml
[1, "ciallo", false]
```

那么 `getList` 返回的列表就等价于 Kotlin 中的如下版本：

```kotlin
val a: List<Any> = listOf(1, "ciallo", false)
```

第一个元素的类型是 `Int`、第二个是 `String`、第三个是 `Boolean`，但是 `List` 中的元素**只能有一个类型**，那么这个类型就只能取这些元素的**公共基类** —— 也就是找出它们共通的部分。

归根结底，这都是因为 YAML 当中列表的元素**可能类型不同**，而且 Bukkit 也无法事先预知这是什么类型，于是只好拿 `List<Any?>` 来兜底了。当我们实际使用时，需要把其中的元素转换成正确的类型，于是在这里我们就使用 `as List<ItemStack>`，因为我们知道 `kit-content` 中存储着物品栏信息。

但这还不是全部！如果你已经在 IDEA 中添加了上述代码，你会发现 IDEA 给出了一个警告：

```
Unchecked cast of '...' to 'List<ItemStack>'.
```

这是在告诉我们，**把 `List<Any?>` 转换为 `List<ItemStack>` 是不安全的**。好吧，不得不承认，这里是笔者偷了点懒。我们没有把 `List` 中的元素逐个由 `Any?` 转换为 `ItemStack`，而是直接对**整个列表**进行类型转换。这么做很危险，因为 Kotlin（和 Java）在类型转换时是**不会检查类型参数**的，像下面这样的代码完全可以正常运行：

```kotlin
val al: List<Int> = listOf(1, 2, 3)
val bl = al as List<String>     // Kotlin 不会验证 Int 能否转换为 String
println(bl.size)
```

尽管 `al` 的实际类型压根不是 `List<String>`，但 Kotlin 不会发现这个错误，直到有人来访问 `al` 中的元素，而发现这个错误的地方可能距离实际出问题的地方非常远，由此产生很难排查的 bug。

因此，正确的做法是不要对整个 `List` 进行转换，而是使用 `map`，**逐个转换每个元素**：

```kotlin
val kitItems = config.getList("kit-content", emptyList<ItemStack>())!!.map { it as ItemStack }
```

如果列表中每个元素真的都是 `ItemStack`，那么 `as` 仅仅进行一次检查，然后就将它原封不动地传递下去。如果有奇怪的东西混进来了，我们也能及早发现问题，而不至于在之后为了调试插件花上几个钟头。

## 读取玩家数据

我们还需要另一个键来存储已经领取过初始套装的玩家，类似的事情你已经做过了，应该能很快写出相应的代码：

```kotlin
val kittedPlayers = config.getStringList("kitted-players").map { UUID.fromString(it) }.toMutableSet()
```

由于 UUID 是无法直接存储的，因此我们只能存储字符串，并使用 `UUID.fromString` 将它从字符串转换回来。`getStringList` 是 `getList` 的变种，它会自动完成读取和转换的工作，提供给我们一个美好的 `List<String>`。我们还使用 `toMutableSet` 将结果转换为可写的，因为在插件运行的时候，我们需要持续记录哪些玩家已经领取了初始套装。

## 保存配置内容

虽然我们目前是在 `onEnable` 中将 `kitItems` 和 `kittedPlayers` 读出来，但我们稍后还需要在 `onDisable` 中将它们**写回**配置文件，因此我们需要将它们提升为属性，并在 `onDisable` 中调用 `set`：

```kotlin
class Liftoff : JavaPlugin() {
    private lateinit var kitItems: List<ItemStack>
    private lateinit var kittedPlayers: MutableSet<UUID>

    override fun onEnable() {
        kitItems = config.getList("kit-content", emptyList<ItemStack>())!!.map { it as ItemStack }
        kittedPlayers = config.getStringList("kitted-players").map { UUID.fromString(it) }.toMutableSet()
    }

    override fun onDisable() {
        config.set("kitted-players", kittedPlayers.map { it.toString() })
        config.set("kit-content", kitItems)     // 我们可以直接写入一列 ItemStack！
        saveConfig()
    }
}
```

类似的事情我们以前做过，不过这次我们没有将属性初始值设为 `null`，而是使用了 `lateinit` 关键字，表示“这个变量稍后再初始化”。`lateinit` 适用于那些**一旦初始化就不会再设为 `null` 的值**，这样可以省去不必要的 `null` 判断。

:::info 缓冲与缓存

读者可能会好奇，为何不在需要的时候直接从配置文件中读取值呢？这是因为无论读取还是写入配置都是一项消耗时间的工作，因为 Bukkit 要把存储在 YAML
中的内部结构转换为 Kotlin 对象。除此之外，`List` 的查找效率也不如 `Set` 高。因此，我们先一次性读取配置，将它存入内存中更高速的结构中并使用，同时在服务器关闭时再将数据存回配置文件。

像这种将低速数据源的部分或全部加载到高速数据源的过程，叫做**缓冲（Buffering）** 或者**缓存（Caching）**。这两个词在 Web 开发上有些区别，但我们暂且不进行区分。

:::