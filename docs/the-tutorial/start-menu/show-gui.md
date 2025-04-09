---
sidebar_position: 5
---

# 4-4 创建和响应 GUI

## 构造物品栏

让我们先来实现“显示 GUI”的功能，既然 GUI 是基于物品栏的，因此当然首先要创建物品栏。

你可能会认为，**物品栏（Inventory）** 是属于某个箱子、酿造台、玩家或者什么其它来源的，也许要在世界中放一个箱子，再把它打开……但实际上不是如此，物品栏是独立的对象。

每个物品栏都有一个**所有者（Holder）**，我们的插件物品栏也不例外。**为了创建新的物品栏，我们就必须创建一个物品栏所有者**。Bukkit 要求物品栏所有者实现 `InventoryHolder` 接口，因此我们新建一个类，并在其中创建我们的物品栏：

```kotlin
class StartMenuInventoryHolder : InventoryHolder {
    // 省略了 inventory 属性的类型，Kotlin 可以自动推断
    // this 代表当前对象，即由 StartMenuInventoryHolder 创建的对象
    private val inventory = Bukkit.createInventory(this, 1 * 9, Component.text("开始"))

    override fun getInventory(): Inventory = inventory
}
```

:::info 我的还是我的

细心的读者或许已经发现，`Player` 也实现了 `InventoryHolder`，为什么不直接让玩家持有这个物品栏，而要麻烦地新建一个类呢？这是因为我们想要**确保由插件创建的物品栏也都属于插件**（这看上去是句废话），而不是属于玩家。如果不这么做，像 Nyaci 那样聪明的小丫头就会自己拿一个箱子，往里面放入合适的物品，我们的插件就会把它**误认为是个菜单**，那就乱套了！

:::

`createInventory` 用来创建物品栏，这个方法有多个**重载**，我们使用的是下面这个：

```kotlin
/**
 * 创建一个属于 `holder` 的物品栏，大小为 `size`，并以 `title` 作为标题。
 * `size` 必须是 9 的倍数，最小为 9，最大为 54。
 */
fun createInventory(holder: InventoryHolder, size: Int, title: Component)
```

*为什么 `title` 是 `Component` 而不是 `String`？啊哈，其实 `Component` 不仅能用来表示聊天信息，也能用在像标题、物品名称等各种地方。*

:::tip 术语库

**重载（Overwrite）** 就是指同名的方法可以拥有不同的参数列表，Kotlin 通过所提供的参数来确定要调用哪个方法。

:::

在对 `inventory` 属性的初始化中，我们将 `this`（即 `StartMenuInventoryHolder` 的对象）传递给 `createInventory` 的第一个参数，设置其所有者。至于下面的 `getInventory`，是写在 `InventoryHolder` 接口中的定义，因为这个接口代表“物品栏持有者”，Bukkit 自然会问“你持有什么物品栏？”，因此就有了这个方法。

顺便一提，这里我们使用了**简化返回值**的语法，在 Kotlin 中，以下的代码是等价的：

```kotlin
fun foo(): ReturnType = someValue

fun foo(): ReturnType {
    return someValue
}
```

这种语法让我们无需创建函数体也能**快速地返回一个值**，对于 `getInventory` 这种只需要返回一个值的方法是再好不过了！

当创建了 `StartMenuInventoryHolder` 类后，稍后就可以**通过实例化它来获得一个物品栏**，不过让我们先把这个放在一边，等到编写事件处理器时再使用。

## 填充物品

由于物品栏是在 `StartMenuInventoryHolder` 中创建的，因此向其中填充物品也需要在那里完成。还记得“在对象创建后做一些事情”要怎么做吗？通过 `init` 块：

```kotlin
class StartMenuInventoryHolder : InventoryHolder {
    private val inventory = Bukkit.createInventory(this, 1 * 9, Component.text("开始"))

    init {
        // 向 inventory 中添加物品
    }

    override fun getInventory(): Inventory = inventory
}
```

由于创建物品本身也是个很麻烦的事情，而且我们有四个按钮要做，因此我们创建一个函数 `makeButton`，这样我们只需要写一遍创建物品的代码，然后可以反复使用它四次：

```kotlin
fun makeButton(mat: Material, label: String): ItemStack {
    val item = ItemStack(mat)
    val meta = item.itemMeta
    meta.customName(Component.text(label))
    item.itemMeta = meta
    return item
}
```

至于为什么物品的创建要这么写，说明起来比较复杂，所以这里就请大家先按捺住好奇心，暂且记住这样的写法，我们将在今后讲解相关的内容。（都是笔者不好，真是对不起）

然后，向 `init` 块中增加代码来创建物品栏：

```kotlin
class StartMenuInventoryHolder(
    config: ConfigurationSection    // 和 EventHandlers 一样，通过构造函数传递获取配置对象
) : InventoryHolder {
    private val inventory = Bukkit.createInventory(this, 1 * 9, Component.text("开始"))

    init {
        // 创建物品并添加到物品栏
        inventory.addItem(
            makeButton(Material.BARRIER, "重新部署"),
            makeButton(Material.FIREWORK_ROCKET, "快速起飞"),
            makeButton(Material.COMPASS, "查询延迟"),
            makeButton(Material.COMMAND_BLOCK, config.getString("command.label", "执行命令")!!)
        )
    }

    override fun getInventory(): Inventory = inventory
}
```

我们使用相同的方式，将配置文件对象通过构造函数传递，与 `EventHandlers` 中不同，在这里由于 `config` 只在创建物品栏时使用一次，因此没必要把它列作属性，当作一个普通的构造函数参数就好。

`addItem` 方法接受多个参数，将它们逐个填入物品栏中。这个方法的作用实在是太过于浅显易懂，以至于我们都不需要把它的方法签名列出来就知道它的功能（笑）。

最后一个物品的标签需要从配置文件中提取，键名是 `command.label`。

## 处理物品栏事件

当玩家点击我们创建的这些“按钮”时，服务器会收到事件，我们需要在那里实现相关的功能（例如将玩家向上抬升）。添加一个监听 `InventoryClickEvent` 的事件处理器：

```kotlin
@EventHandler
fun onInventoryClick(ev: InventoryClickEvent) {
    // 要做之事
}
```

### 确保那是你

首先要判断的是，这个事件所涉及的物品栏到底**是不是我们的物品栏**。当前事件所涉及的物品栏在 `ev` 下的 `clickedInventory` 属性中，但它可能是 `null`，所以要先做判断。

> Nyaci：这个神奇的 `null` 到底是什么东西呢？

好吧，如果你真的很感兴趣，这又是一个 Java 的历史遗留问题……

在 Java 中，`null` 用来表示“空值”，类似于 C 语言中的空指针。在任何需要某个对象的地方，都可以使用 `null` 来代表“什么也没有”。但是，`null` 有两个极为致命的问题：

- 试图对值为 `null` 的对象调用任何方法，或者使用它的任何属性，都会触发 `NullPointerException` 异常（也就是发生错误）。
- 任何对象都有可能是 `null`。

也就是说，在下面这样的代码中：

```java
Player p = ev.getPlayer()                   // p 可能是 null
InventoryView iv = ev.getOpenInventory()    // iv 可能是 null
ItemStack item = iv.getItem(0)              // item 可能是 null
```

各种值都有可能是 `null`（甚至 `ev` 本身也有可能是）！如果要确保程序万无一失，就需要用 `if` 来判断各种值是不是 `null`，这是非常麻烦的！可如果不这么做（像大多数 Java 程序那样），那么这些可能是 `null` 的值就是一颗颗定时炸弹，只要传入一个 `null` 就会让程序崩溃。

Kotlin 吸取了 Java 的教训，在 Kotlin 中，如果一个值可能是 `null`，则需要在它的类型中明确指定：

```kotlin
val canBeNull: Int? = null  // Int 后面的 ? 允许 canBeNull 是 null
val notNull: Int = null     // 不行！
```

而任何可能是 `null` 的值，在使用前都必须检查：

```kotlin
val canBeNull: Int? = null

if (canBeNull > 0) { /* ... */ }        // 不行！canBeNull 可能是 null

if (canBeNull != null) {
    if (canBeNull > 0) { /* ... */ }    // 可以执行，因为已经确定 canBeNull 不是 null
}
```

回到 `clickedInventory` 属性来，如果你查看这个属性的类型，你会发现它是 `Inventory?`，代表 Kotlin 从 Bukkit 的代码中推断出来这个值可能是 `null`，当玩家点击物品栏格子之外的地方时，这个值也确实可能是 `null`，你可以在 Javadoc 上查到这一点。

因此，在检查物品栏的所有者之前，**必须判断它是不是 `null`**。你可能会想使用 `if`，不过在 Kotlin 中有一种更方便的写法：

```kotlin
val iv = ev.clickedInventory ?: return
```

`?:` 运算符（被称作 **Elvis 运算符**）检查它前面的值是不是 `null`。`A ?: B` 的意思是，如果 `A` 是 `null`，则值为 `B`，否则为 `A`。在 Kotlin 中，由于 `return` 是一个表达式，因此我们把 `return` 放在 `?:` 后面，意思就是 **“如果 `ev.clickedInventory` 是 `null`，那就直接离开函数”**，只有当 `ev.clickedInventory` 不是 `null` 的时候，代码才继续执行，这个值被赋给 `iv` 变量。

这样我们就在一行内完成了“判断是否是 `null`”和“提取属性并赋给变量”的工作，代码就写得很简洁，这正是 Kotlin 的诸多魅力之一。

现在我们就能判断 `iv` 的所有者（对应是 `holder` 属性）是否是我们的 `StartMenuInventoryHolder` 了：

```kotlin
if (iv.holder is StartMenuInventoryHolder) {
    // 确定这就是我们的物品栏
}
```

`is` 用来判断指定的对象的**实际类型是否是指定类型或其派生类**，也就是说，`a is B` 判断 `val x: B = a` 这样的事情能不能发生。`holder` 属性存储着我们先前通过 `createInventory` 方法创建物品栏时指定的所有者对象，那么显然，如果这是我们的物品栏，`holder` 属性必定是 `StartMenuInventoryHolder` 的一个实例，上面的 `is` 测试就能通过。

### 谁在切洋葱？

在确实这是我们的物品栏后，我们接下来要确定**哪名玩家**（或者其它什么东西）点击了物品栏，这可以通过 `whoClicked` 属性获得：

```kotlin
val clicker = ev.whoClicked as? Player ?: return
```

`whoClicked` 属性的类型是 `HumanEntity`（“人类”实体），尽管在游戏中，事实上的 `HumanEntity` 只有 `Player`，但是从形式上来说 `whoClicked` 还是有可能是别的类型（即不是 `Player` 及其派生类），因此要做这样的判断。

`as?` 运算符是**尝试类型转换算符（Safe Cast Operator）**（嗯没错，这么翻译是为了押韵），与以前用过的 `as` 强制类型转换算符功能类似，它尝试将 `whoClicked` 的类型转换为 `Player`，但如果不能做这样的转换，那么它返回 `null`，而不会像 `as` 那样直接报错。我们随后用 `?:` 来判断转换是否成功（值不是 `null`），如果失败，就离开函数。

*当然，也可以使用 `is` 来判断 `whoClicked` 是不是 `Player` 类型，但那样代码就会写得长一些，而且无法体现 Kotlin 的简洁性。*

`clicker` 仅在转换成功时才被赋值，因此 Kotlin 推断出它的类型是 `Player`，非常好！

### 获取物品

接下来通过 `currentItem` 来获取被点击的物品。你可能已经猜到了，这个属性也有可能是 `null`，例如当被点击的格子中什么也没有的时候。

<details>
<summary>你是职业选手吗？</summary>

与方块不同，物品栏中的空白是真的“什么都没有”，而不是空气。

</details>

```kotlin
val item = ev.currentItem ?: return
```

### 保护物品栏

在 Bukkit 中，许多事件有一些**默认行为**，例如 `InventoryClickEvent` 的默认行为是把物品移到玩家的光标下，玩家稍后可以将它放到自己的背包中，或者扔在地上。这对于菜单可不行！如果不对我们的菜单物品栏做任何保护，玩家就可以从里面源源不断地拿烟花火箭、屏障和命令方块，这可不是什么好事（当然，也许你会希望这么做）。

要取消事件的默认行为，可以将它的 `isCancelled` 属性设为 `true`：

```kotlin
ev.isCancelled = true
```

这样，当玩家点击物品时，Bukkit 知道我们要取消默认行为，也就不会把菜单物品栏中的物品挪到玩家的光标下了。

---

在获取了物品信息并取消事件默认行为后，我们就可以根据物品的类型（或者名称），判断用户点击了哪个按钮。不过由于这一节太长了，因此让我们把这部分内容挪到下一节吧。