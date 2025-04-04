---
sidebar_position: 5
---

# 5-5 处理命令

## 设置命令处理函数

在完成了事件监听后，接下来要做的就是添加一个供管理员实时启停插件的命令了，我们先前已经在 `plugin.yml` 中添加了这样的内容：

```yaml
commands:
  chunk-heat:
    usage: /chunk-heat <enable|disable>
    description: Enable or disable chunk heat calculation.
```

所以命令处理函数看上去像这样：

```kotlin
server.getPluginCommand("chunk-heat")?.setExecutor { sender, command, label, args ->
    // 要做之事
}
```

## 检查权限

`/chunk-heat` 命令能够配置整个服务器级别的功能，如果任何人都可以随意使用这条命令，那就要乱套了！像这种**管理员命令**只能由管理员（Server Operator，简称 OP）进行操作。Bukkit 为 `CommandSender` 设置了 `isOp` 属性，用来确认发送命令的人是否是管理员，所以这样的代码很容易写：

```kotlin
if (sender.isOp) {
    // 执行命令
} else {
    sender.sendMessage(Component.text("/chunk-heat: 权限不够"))
}
```

这里我们使用 `sender.sendMessage` 方法告知发送命令的人：“你没有执行这条命令需要的权限！”，和 `player.sendMessage` 的功能完全相同，不过这次的接收方换成了命令发送者而已。

## 解析参数

参数的信息存放在 `args` 中，`args` 的类型是 `Array<String>`，即一组 `String`。我们可以通过 `Array` 类的 `firstOrNull` 方法来访问第一个元素：

```kotlin
/**
 * 尝试获取数组中的第一个元素，并将它返回。
 * 如果数组为空，则返回 `null`。
 */
fun firstOrNull(): T?
```

```kotlin
when (args.firstOrNull()) {
    "enable" -> config.set("enabled", true)
    "disable" -> config.set("enabled", false)
    else -> sender.sendMessage(Component.text("/chunk-heat: 指定的操作无效"))
}
```

这不是我们第一次使用 `when` 了，它将 `()` 内的值与 `{}` 内提供的值进行**匹配**，并执行第一个匹配到的分支。上面的代码查看第一个参数是否为 `enable` 或 `disable`，如果是，就通过 `config.set` 设置配置文件的内容，否则，通过 `sender.sendMessage` 告知命令发送者参数无效。

`config` 对象的 `set` 方法用于**临时**改变配置的内容，除非手动保存，否则这些修改不会写入到文件中，在服务器重启后就会丢失。一般而言，插件是不能随意更改用户配置的，所以我们也就不保存这一修改

对 `config` 的任何改动都是**实时生效**的，也就是说，在我们修改了 `config.set` 后，先前的事件处理函数中下一次对 `config.get` 的调用将返回新的结果。

---

完整的命令处理代码如下（在 `onEnable` 方法中）：

```kotlin
server.getPluginCommand("chunk-heat")?.setExecutor { sender, command, label, args ->
    if (sender.isOp) {
        when (args.firstOrNull()) {
            "enable" -> config.set("enabled", true)
            "disable" -> config.set("enabled", false)
            else -> sender.sendMessage(Component.text("/chunk-heat: 指定的操作无效"))
        }
    } else {
        sender.sendMessage(Component.text("/chunk-heat: 权限不够"))
    }

    true
}
```

我们在最后用 `true` 作为 Lambda 的返回值，即不管命令是否成功都返回 `true`，这是因为，如果返回 `false`，Bukkit 将向用户显示命令的用法，但是我们在命令内部已经做了相应的提示，就不需要 Bukkit 再这么做了，所以我们总是可以“假装”命令是成功执行的（笑）。