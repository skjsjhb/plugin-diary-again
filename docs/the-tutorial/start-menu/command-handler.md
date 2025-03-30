---
sidebar_position: 8
---

# 4-6 处理命令

先前我们已经在 `plugin.yml` 中添加了 `menu` 命令，但它没有相应的处理代码，所以尝试执行这条命令时，Bukkit 什么也不会做（实际上只会把你输入的命令原样显示给你）。所以，像事件处理函数一样，我们现在要添加一个**命令处理函数（Command Executor）**，来**解释**命令。

:::tip 术语库

对命令的**解释（Interpret）** 就是分析命令中的内容，并执行相应的代码。由于看上去是把命令翻译到 Kotlin 代码，因此被称为解释。

:::

向 `onEnable` 中添加如下代码：

```kotlin
server.getPluginCommand("menu")?.setExecutor { sender, command, label, args ->
    // 处理命令
}
```

`getPluginCommand` 和 `setExecutor` 的功能如下：

```kotlin
/**
 * 获取该插件注册的名为 `name` 的命令对象。
 */
fun getPluginCommand(name: String): PluginCommand

/**
 * 为当前命令对象设置命令处理函数。
 */
fun setExecutor(fn: CommandExecutor): Unit
```

如果你去查看 `CommandExecutor`，你会发现它是一个接口，并且其中只有一个方法。Kotlin 规定，如果某个接口**只有一个抽象（未实现的）方法**，那么可以**用这个方法所对应的 Lambda 替代该接口的对象**。当然，要这么做，需要在 Lambda 前增加一点东西：

```kotlin
interface Flyable {
    fun fly(): Unit
}

// 只要把 fly 用 Lambda 实现就行
// 再加上 Flyable，让 Kotlin 自动把它打包成一个 Flyable 对象
val a: Flyable = Flyable { println("flying!") }
```

仅仅将接口名附加在 Lambda 前，就可以将 `接口名 { Lambda 代码 }` 当作**那个接口的一个对象**来使用！

回到我们的插件来，`CommandExecutor` 当中只有如下的一个 `onCommand` 方法：

```kotlin
fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<String>): Boolean
```

也就是说，只要我们创建一个与上述函数**参数相同且返回值相同**的函数，再在前面添加一个 `CommandExecutor`，就可以**直接将它当作一个 `CommandExecutor` 对象**来使用！

这实在是太方便了，不过还有更方便的，Kotlin 规定，当以上面这种形式创建的对象通过**参数**传递时，可以**省略前缀的接口名**，也就是说，我们可以**直接把一个 Lambda 传递给 `setExecutor`**！这下子这个 Lambda 成为唯一一个参数了，那么也可以去掉小括号，这就得到了上面的代码。Kotlin 会正确推断这个过程中所有的类型，所以我们只需要指定四个参数，而不需要手动标注它们的类型。

四个参数的作用分别是：

- `sender`：命令发送者
- `command`：所使用命令的信息
- `label`：命令使用时所用的名称（有些命令根据名称不同会做不同的事情）
- `args`：一个包含命令参数的数组

在这个插件中，我们只用到 `sender`（用于显示菜单），在后续的项目中，我们会经常用到剩余的参数，用来处理更复杂的命令。

当设置命令处理函数后，我们现在要在命令处理函数（那个 Lambda）中添加相关的代码：

```kotlin
if (sender is Player) {
    sender.openInventory(StartMenuInventoryHolder(config).inventory)
    true
} else {
    false
}
```

`sender` 参数包含了命令使用者的信息，我们首先要判断它是不是玩家，因为发送命令的也可能是服务器控制台。如果我们确定发送者是玩家，我们就调用 `openInventory` 方法，向玩家**展示物品栏**。

至于 `openInventory` 的参数，我们创建了一个 `StartMenuInventoryHolder`（也就是物品栏所有者）的实例，同时也相应创建了相关的物品栏（还记得 `StartMenuInventoryHolder` 里的 `init` 吗？），我们随后通过 `inventory` 属性访问该物品栏，并将它传给 `openInventory`。

代码中的 `true` 和 `false` 是命令处理函数的返回值，这个返回值的意思是 **“命令是否成功”**，Bukkit 会根据这个决定是否向用户显示帮助，或者记录命令执行状态什么的。为什么用这种写法呢？这是 Lambda 返回值的特性，我们先前提到过：

- Lambda 的返回值是其最后一个表达式的值。
- 在这里，最后一个表达式是 `if { ... } else { ... }` 整体。
- `if` 表达式的值是其两个 `{}` 中的值之一。
- 两个 `{}` 的值分别是它们当中最后一个表达式的值。

所以上面的 `if` 表达式在条件成立时值为 `true`（第 3 行），条件不成立时值为 `false`（第 5 行），然后这个值被作为 Lambda 的返回值传回给 Bukkit。这就 OK 了！

---

至此，整个项目的代码也就算是完成了，最终的 `Main.kt` 有近 100 行代码，出于篇幅原因，没办法在这里全部放下，不过你始终可以通过项目的源代码仓库来查看用到的所有文件。