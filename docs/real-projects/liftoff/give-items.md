---
sidebar_position: 8
---

# LT-5 获取、编辑初始套装

## 获取初始套装

### 处理命令

让我们先来完成套装的获取，即 `/kit` 命令的处理：

```kotlin
server.getPluginCommand("kit")?.setExecutor { sender, command, label, args ->
    if (sender is Player) {
        if (kittedPlayers.contains(sender.uniqueId)) {
            // 玩家已经领取过
            sender.sendMessage(Component.text("You have already acquired the kit!"))
        } else {
            // 玩家还没有领取过

            // TODO 向物品栏中添加物品

            kittedPlayers.add(sender.uniqueId)  // 标记玩家已经领取过
            sender.sendMessage(Component.text("You have acquired the kit!"))
        }
    }

    true
}
```

我们首先确认命令来源是玩家，然后通过 `contains` 检测玩家的 UUID 是否在 `kittedPlayers` 中（即已经领取过初始套装），并发送相应的消息。

:::note 我等会再用

`TODO` 是一种约定，称作 **TODO 标记**，通常加在注释中，表示“这里还有些事情要做”，这样就不至于稍后审阅代码的时候忘记这一点。类似的还有 `FIXME`（需要修复）、`XXX`（性能问题）等。

当然，TODO 标记并没有用词限制，你完全可以使用自己喜欢的词语（`// Ciallo~` 当然也可以！），不过 IDEA（和其它编辑器）会高亮显示上述约定俗成的名称。

:::

### 添加多个物品

接下来实现添加物品的功能：

```kotlin
sender.inventory.addItem(*kitItems.toTypedArray())
```

这里又出现了一个新语法：`*`，这可不是乘号 —— Nyaci 你不要跑，这也并不是指针！—— 这个 `*` 是**可变参数展开算符（Vararg Spread Operator）**。在 Kotlin 中，一些函数可以接受**可变数目的参数**：

```kotlin
fun foo(vararg str: String) {
    // str 类型为 Array<String>
    str.forEach { print(it) }
}

foo("a")        // 输出 a
foo("a", "b")   // 输出 ab
```

由于在 Bukkit 中，`addItem` 通常被用来添加一个或几个物品，因此设计 Bukkit 的人就在这个函数中使用了可变参数，方便我们写出这样的代码（而不需要构造一个列表）：

```kotlin
inv.addItem(someDiamonds, someIngots, someSkulls)
```

可是，现在我们**已经有了一个列表**，而我们希望把它传递给 `addItem`。我们不能直接把列表放在括号中，因为 Kotlin 会**认为它是第一个参数**。我们也不能傻乎乎地用 `kitItems[0]`、`kitItems[1]` 传递每个元素，因为我们不确定 `kitItems` 到底有多大。

为了处理这种情况，Kotlin 提供了 `*` 运算符，它将提供的数组**展开** —— 把数组中的每个元素依次拿出来，按顺序填在可变参数中：

```kotlin
fun foo(vararg str: String) {
    // str 类型为 Array<String>
    str.forEach { print(it) }
}

foo(arrayOf("a", "b"))  // 不行！Kotlin 会认为 arrayOf(...) 是第一个参数
foo(*arrayOf("a", "b")) // 等效于 foo("a", "b")
```

*如果你有过“手上拿着一堆潜影盒，想拿出其中的物品”这样的经历，你一定会希望 Minecraft 也有这种功能（笑）。*

由于 `*` 只能用于数组（`Array`），因此我们需要把 `List` 类型的 `kitItems` 转换为数组，这只需要使用 `toTypedArray` 方法即可做到。

### 处理多余物品

虽然像上面这样“一条语句解决所有问题”是所有工程师们的终极梦想，但遗憾的是，`addItem` 并不能完美实现“赋予玩家物品”这个设计，因为玩家的物品栏可能**不足以放下新物品**。`addItem` 只是“尽力而为”地把指定的物品塞进玩家的物品栏，至于放不下的物品要怎么处理，它无能为力。

:::info 理想很丰满……

像这样**设计功能与实际实现功能不一致**的情况，在插件设计中非常常见，即使是有经验的开发者也时常会犯错。Minecraft 是一个复杂的系统，其中有很多违背直觉的地方。作为玩家，我们已经习惯于“获得物品就是把它捡到物品栏里”，因此当角色转换为开发者后，我们往往很难第一时间意识到“把物品放进物品栏，并不意味着物品交付到了玩家手上”这个事实。

应该说，出现这样的设计缺陷是在所难免的，但这些问题可以尽量减少。本书中展示了一些常见的操作该如何正确实现（例如本项目中的“赋予物品”），以供读者参考。除此之外，若要问有什么非经验性的方法，那就是“多画不等号”，多问问自己：“这段代码的实际功能是什么？我想要的是这个吗？”

:::

这个问题有几种解决方法：

- 尝试将物品放在玩家的末影箱中。
- 若无法放入全部物品，则取消操作，并提醒玩家清理物品栏。
- 把剩余的物品扔在玩家的附近，供玩家自行拾取。
- 在玩家附近生成一个容器（不一定要是实际的箱子）并存入物品。
- 将未领取的物品留在初始套装中，玩家可以稍后使用 `/kit` 再次获取。
- 寻找玩家附近的可用容器并将物品放入。
- 丢弃未领取的物品。

这些实现方法适用于不同的场景，优缺点也不尽相同。在本项目中，我们选择将物品刷新在玩家脚下，这主要是出于以下的几点考虑：

- 大多数玩家领取初始套装时，都会处于一个安全的地方（例如主城），刷新的物品不太可能被摧毁。
- 这比较符合原版游戏中“物品溢出”时的表现。
- 这很容易做到。

`addItem` 方法会将未成功添加的物品以 `Map<Int, ItemStack>` 的形式返回，其中的键是该物品在 `addItem` 中的参数位次，值则是物品本身（数量可能有所变化）。我们可以使用 `values` 属性来访问 `Map` 的所有值，并将这些物品生成在世界中：

```kotlin
rest.values.forEach {
    sender.world.dropItem(sender.location, it)
}
```

`sender.world` 获得玩家所在的世界对象（`World`），`dropItem` 在该世界中的指定位置生成物品。`World` 是一个复杂的接口，包含了诸多与世界交互的功能，这次我们使用的是“在世界中生成物品”。`sender.location` 获取玩家当前的位置信息。

<details>
<summary>完整的 `/kit` 命令处理代码</summary>

```kotlin
server.getPluginCommand("kit")?.setExecutor { sender, command, label, args ->
    if (sender is Player) {
        if (kittedPlayers.contains(sender.uniqueId)) {
            sender.sendMessage(Component.text("You have already acquired the kit!"))
        } else {
            val rest = sender.inventory.addItem(*kitItems.toTypedArray())
            rest.values.forEach {
                sender.world.dropItem(sender.location, it)
            }
            kittedPlayers.add(sender.uniqueId)
            sender.sendMessage(Component.text("You have acquired the kit!"))
        }
    }

    true
}
```

尽管中间变量 `rest` 是不必要的，但我们没有选择把 `values` 接在 `addItem` 后面，因为我们想凸显“添加物品”和“处理多余物品”是两个独立的操作，这有助于改善代码的可读性。

</details>

## 修改初始套装

虽然物品信息理论上是可以通过命令编辑的，但使用过 `/give` 或 `/data` 命令的人都知道，只要物品的数目开始变多，或者属性变得复杂，手动输入命令来更改物品信息压根就是不切实际的事情。

为了让插件更容易使用，我们将允许管理员通过**交互式**的方式修改初始套装内容，方法是显示一个物品栏，允许管理员在其中增减物品，相应的修改会反映到初始套装中。这项功能分为两个部分：

- 当 `/kitmod` 命令触发时：显示专用物品栏。
- 当物品栏关闭时：更新 `kitItems` 的值。

和旅行背包插件一样，为了使用和区分物品栏，我们需要实现一个 `InventoryHolder`（希望你还没有忘记这一点）：

```kotlin
private class KitModInventoryHolder : InventoryHolder {
    private val inv = Bukkit.createInventory(this, 3 * 9, Component.text("Modify Starter Kit"))
    override fun getInventory(): Inventory = inv
}
```

这次我们使用 27 格，即一个标准箱子的大小，这样即使初始套装中塞得满满当当，玩家也还有办法腾出快捷栏，不至于“拿到手软”（笑）。

然后我们在 `onEnable` 中快速地写一个事件监听器，处理物品栏关闭时的事件：

```kotlin
server.pluginManager.registerEvents(object : Listener {
    @EventHandler
    fun onInventoryClose(ev: InventoryCloseEvent) {
        if (ev.inventory.holder !is KitModInventoryHolder) return
        kitItems = ev.inventory.storageContents.filterNotNull()
        ev.player.sendMessage(Component.text("Kit content altered."))
    }
}, this)
```

`!is` 运算符，顾名思义，就是 `is` 的否定版本。`a !is B` 和 `!(a is B)` 的功能完全相同，不过前者可以少写一对括号。剩余的部分都和旅行背包插件差不多：使用 `storageContents` 获取物品栏中的所有物品，并通过 `filterNotNull` 删去其中的空格子。我们随后把这个新的列表赋给 `kitItems`，并通知玩家“套装内容更新完成”。

最后，我们为 `/kitmod` 命令编写一个处理函数，显示刚才制作好的物品栏。这都是我们之前做过的事情，因此下面的代码你不会感到陌生的：

```kotlin
server.getPluginCommand("kitmod")?.setExecutor { sender, command, label, args ->
    if (sender is Player) {
        if (sender.isOp) {
            val inv = KitModInventoryHolder()
            sender.openInventory(inv.inventory)
        } else {
            sender.sendMessage(Component.text("Permission denied."))
        }
    }

    true
}
```

我们使用原版游戏的权限系统，仅允许管理员拥有修改套装内容的特权。有过服务器运营经验的读者可能会觉得“不是应该有 `kit.mod` 这样的权限吗？”，的确，仅仅区分管理员和普通玩家，在许多情况下是不够方便的，不过这些涉及权限管理的内容，还是让我们留到专门的章节中吧。

