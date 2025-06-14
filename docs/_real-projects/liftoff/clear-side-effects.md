---
sidebar_position: 10
---

# LT-EX-1 清理副作用

## 不需要的东西

像“设置套装时会消耗自身物品”这样的问题，其实是在说明，下面的两个动作是**绑定**在一起的：

- 改变套装的内容
- 物品移入物品栏

这是因为我们通过让管理员改变物品栏，间接地改变套装的内容。也就是说，我们在**借用一个游戏机制**达成我们的目标（改变套装内容），但这个机制本身的效果（物品从玩家物品栏移走）却是我们不需要的，这就是**副作用（Side Effects）**。

**消除插件中不需要的副作用**是插件设计的重要步骤。尽管通过仔细研究游戏机制和对应的代码，是能够事先排查出这种副作用的，但这种说法就和“所有的 bug 都能通过看代码找出来”一样没有可行性。因此，发现和移除副作用需要在整个项目周期中持续进行。

## 恢复物品栏

通常来说，如果能够阻止副作用的发生，那是再好不过了。但有时，副作用是无法避免的，那么就只能在事后消除它们的影响。本项目就属于第二种情况：为了方便编辑套装中的物品，“把物品从玩家物品栏移入编辑物品栏”是不可避免的，因此我们只能在物品栏关闭后进行恢复。

大家可能会想，这个问题简直不要太简单嘛：

- 当 `/kitmod` 执行时，记录玩家物品栏的内容，当物品栏关闭时，恢复物品栏内容。

  ……但是这么做是不行的，因为玩家可以在编辑期间把自己的物品丢出物品栏，当物品栏关闭时其中的内容会恢复，这样就能实现复制物品。你或许会想，管理员本来也可以通过 `/give` 获得无限的物品，但“编辑初始套装”这个权限也可能授予管理员之外的玩家，因此不能简单忽略这个问题。

- 比对 `kitItems` 变量的修改，根据其中的变化相应修改玩家物品栏。

  ……这么做也还是不行的，因为玩家同样可以把拿出的物品扔出物品栏来防止被删除，也就是说，对物品栏的修改可能**无法被完全撤销**。如果要强行追溯，去搜索世界中所有的物品，会非常消耗性能。

虽然这两种方案都不能直接使用，不过它们的大体思路是差不多的。实际上，这个问题之所以这么难解决，是因为它包含两个部分：

- 返还玩家所移入编辑物品栏的物品。
- 消除从编辑物品栏拿出的物品。

问题在于要区分哪些物品属于编辑物品栏并非一件显而易见的事情，仅仅通过“比对物品栏内容”是很难做到的。笔者接下来将为大家介绍一种方法，它能够基本解决这个问题。

## 标记物品

我们的想法是在物品上**添加一个标记**，标记它是否属于编辑物品栏。我们可以使用 PDC 来做到这一点：

- 当加载编辑物品栏（开始编辑）时，在其中的物品上全部添加该标记。
- 当存储编辑物品栏（完成编辑）时，移除其中的所有标记。

我们把这个标记的范围完全限制在整个编辑过程中，这样被标记的仅仅是编辑物品栏中的物品，而非初始套装的实际物品（即 `kitItems` 中的物品）。形象地说，在玩家使用编辑物品栏时，把上半边的物品全部染色，但是在完成编辑并存储物品时，洗掉上面的颜色，这样领取套装的玩家拿到的物品就是原始版本。

首先创建一个 `NamespacedKey`，以便稍后访问 PDC：

```kotlin
class Liftoff : JavaPlugin() {
    // ...
    private val kitModMarkerKey by lazy { NamespacedKey(this, "kitmod_marker") }
}
```

我们没有使用 `NamespacedKey.fromString("liftoff:kitmod_marker")` 这样硬编码的方式，而是直接使用 `NamespacedKey` 的构造函数，把插件对象和键名传入。这么做的效果和 `fromString` 是一样的，但如果稍后插件名称修改，我们就不必在整个项目中到处寻找 `fromString` 并修改它们的参数。

然后，在显示编辑物品栏时，添加上述的标记：

```kotlin
// kitmod 命令处理函数中
inv.inventory.storageContents = kitItems.toTypedArray()

// 添加标记
inv.inventory.forEach {
    // it 表示当前物品，可能为 null
    it?.editPersistentDataContainer {
        // it 表示当前物品的 PDC
        it.set(kitModMarkerKey, PersistentDataType.BOOLEAN, true)
    }
}
```

`editPersistentDataContainer` 的功能和 `editMeta` 差不多，它接受一个函数，并将物品的 PDC 作为参数传入。`forEach` 遍历整个 `inventory`，因此 `it` 可能是 `null`（空格子），所以要加上 `?`。

之所以要这么做，是因为 `ItemStack` 实际上是不拥有 PDC 的 —— **PDC 不是物品的一部分，而是物品信息（`ItemMeta`）的一部分**。也就是说，如果要直接操作 PDC，我们就得先获取 `ItemMeta`，修改它的 PDC，再将其设置回去。这么做实在是太麻烦了，所以 Paper 提供了 `editPersistentDataContainer`，允许我们描述“想对 PDC 做什么”，Paper 会把它应用在物品信息的 PDC 上。

同样，在保存初始套装的内容时，相应去除这些标记：

```kotlin
// onInventoryClose 事件处理函数中
kitItems = ev.inventory.storageContents.filterNotNull()

// 删除标记
kitItems.forEach {
    it.editPersistentDataContainer {
        it.remove(kitModMarkerKey)
    }
}
```

## 返还新增物品

在有了这样的标记之后，我们就可以区分“哪些物品是玩家新加入的”，从而把它们正确地返还给玩家，这一步要在保存初始套装内容时完成：

```kotlin
kitItems.forEach {
    // 添加的代码
    if (!it.persistentDataContainer.has(kitModMarkerKey)) {
        // 没有标记，所以是玩家的物品
        val rest = ev.player.inventory.addItem(it)
        rest.values.forEach {
            ev.player.world.dropItem(ev.player.location, it)
        }
    }

    it.editPersistentDataContainer {
        it.remove(kitModMarkerKey)
    }
}
```

我们直接使用了刚刚的 `forEach` 块，这样就可以在一次循环中完成“恢复物品”和“删除标记”两个动作。

在这里我们使用了 `it.persistentDataContainer`，看上去好像是直接访问了 `ItemStack` 的 PDC，但这实际上是 Paper 提供的一个“快捷方式”，允许我们绕过 `ItemMeta` 访问 PDC，但这么做不是没有代价的 —— 这个 PDC 的镜像是**只读**的，不能用它来修改实际 PDC 的内容。

和赋予物品时一样，如果玩家的物品栏中没有空位，我们将物品扔在玩家脚下，所以我们简单复制粘贴了那里的代码。不过，这么做不太好，所以让我们把这两段代码整合到一个扩展函数中：

```kotlin
// 在最外层添加
private fun HumanEntity.giveItem(vararg item: ItemStack) {
    val rest = inventory.addItem(*item)
    rest.values.forEach {
        world.dropItem(location, it)
    }
}
```

```kotlin
// onInventoryClose 事件处理函数中
kitItems.forEach {
    if (!it.persistentDataContainer.has(kitModMarkerKey)) {
        // 这里！
        ev.player.giveItem(it)
    }

    // ...
}
```

```kotlin
// kit 命令处理函数中
if (sender is Player) {
    if (kittedPlayers.contains(sender.uniqueId)) {
        sender.sendMessage(Component.text("You have already acquired the kit!"))
    } else {
        // 这里！
        sender.giveItem(*kitItems.toTypedArray())
        kittedPlayers.add(sender.uniqueId)
        sender.sendMessage(Component.text("You have acquired the kit!"))
    }
}
```

尽管 `Player` 是事实上唯一的 `HumanEntity`，但插件有可能创建其它不是 `Player` 的 `HumanEntity`，所以这个扩展函数是针对 `HumanEntity` 定义的，这同样是“不对参数施加过多要求”思想的体现之一。

<details>
<summary>你是职业选手吗？</summary>

如果你已经熟练于使用其它编程语言了，你可能会下意识写出这样的函数：

```kotlin
fun givePlayerItem(p: Player, vararg items: ItemStack) {
    // ...
}
```

虽然这么做也 OK，但在 Kotlin 中，最好是定义一个扩展函数 `Player.giveItem`。这不仅是面向对象思想的体现，还能在编写链式调用代码时更加方便。

</details>

## 阻止物品拿出

下一步要做的是移除玩家从编辑物品栏中拿出的物品。虽然话是这么说，但实际上如果物品已经被拿出来了，那么要再想办法删除它就很困难 —— 玩家可能会把它转移走。尽管通过阻止带标记的物品丢出能解决一部分问题，但还是不能防止诸如玩家被杀死、其它插件的操作等带来的影响。

经验上来说，应该尽可能**减少副作用的范围**，所以最好的方法是不允许玩家从编辑物品栏中拿出物品，取而代之的是，当玩家点击其中带标记的物品时，**直接将其移除**。这很容易做到，只需要增加一个事件处理函数，监听 `InventoryClickEvent`：

```kotlin
@EventHandler
fun onInventoryClick(ev: InventoryClickEvent) {
    if (ev.clickedInventory?.holder !is KitModInventoryHolder) return
    if (ev.currentItem?.persistentDataContainer?.has(kitModMarkerKey) == true) {
        ev.isCancelled = true
        ev.clickedInventory?.setItem(ev.slot, null)
    }
}
```

我们首先检查 `holder` 属性，判断被点击的物品栏是否是我们的物品栏。随后，我们检查被点击的物品是否被标记，如果是，我们就将事件取消，同时删除物品栏中对应的物品。

:::info

在 Kotlin 中，`null` 不能作为 `if` 的条件，如果要将 `null` 视为 `false`，需要使用 `== true` 这样的写法。

:::

## 验证问题解决

虽然我们添加了不少代码，还改动了拿出物品的逻辑，不过我们确信“物品消耗”和“物品拿出”的问题已经被成功解决了，让我们启动服务器，并验证以下几点：

- 向初始套装中添加物品并关闭物品栏后，放入的物品应当返还。
- 修改初始套装时，单击即会移除物品。
- 在一次编辑中，向物品栏内放入再拿出物品，则可以正常拿出。

如果这些都正常的话，说明我们的辛苦没有白费，可以小小地得意一下了（笑）。

---

从这个问题的修复中，大家应该已经注意到，哪怕是非常简单的功能，如果想让它万无一失，也是需要付出很多的努力的。事实上，说“万无一失”并不准确，上面这样的修复其实并不完美：

- 在保存编辑物品栏后，没办法再次调整其中物品的顺序，只能删除然后重新添加。
- 如果玩家使用自动整理模组，则试图“整理”编辑物品栏会将其中的物品全部删除。
- 其它插件编辑物品栏的功能可能与这些修复冲突。

……以及其它可能未被发现的潜在问题。

应该说，当插件的功能变得复杂时，大多数问题其实都没有万全的解决方案。想要编写一个功能而不与任何原版机制或其它插件冲突几乎是不可能做到的，特别是在完全不了解有哪些其它插件的时候。如何让各个插件在相关功能上安全地协同工作，至今仍没有一个确切的回答，而与之相对的，像本节中所描述的这种问题，可能也并没有一劳永逸的方法完全予以修复。

这样的事实确实有些令人沮丧，但读者应当明白，虽然解决各种冲突是插件开发中不可避免的过程，但正是这些问题促进人们仔细地思考插件工作的逻辑，从而也在一定程度上避免了其它漏洞的出现。另外，尽管像这样的漏洞不可能全数完美解决，但通过持续更新插件，修复新发现的漏洞，仍然能让出问题的几率大大降低，大家可不要觉得“反正永远也修不完”就打退堂鼓呀（笑）！