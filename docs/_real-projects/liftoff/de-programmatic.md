---
sidebar_position: 13
---

# LT-EX-3 像玩家一样思考

欢迎回来！恭喜你从可怕的竞态条件漏洞中逃了出来（笑）。这一节让我们来说点轻松的话题。

## 在代码之外

大多数插件开发者，在其生涯的某个时期，都有过这样的想法：

> 哎呀，做这种复杂的功能干什么嘛，明明读一下数据库就好了，去掉，去掉……

这种想法其实可以理解 —— 像“显示余额”这种功能，原理非常简单，但是要编写成 Kotlin 代码还是需要一些功夫的：

```kotlin
server.getPluginCommand("balance").setExecutor { sender, _, _, args -> 
    if (sender !is Player) return@setExecutor false

    args.firstOrNull()?.let {
        queryBalance(it)?.let { b ->
            sender.sendMessage(Component.text("您持有 $b 货币 $it"))
        } ?: sender.sendMessage(Component.text("没有名为 $it 的货币"))
    } ?: sender.sendMessage(Component.text("需要货币参数"))

    true
}
```

当这样的功能需求开始增加时，像上面这样“看起来没什么用”的代码就很让人烦。

那么，为什么像这样的功能还需要存在呢？这是因为在开发插件时，我们是站在**程序的角度（Programmatic）** 看插件的功能的，在你的脑海里，“发送消息” 是 `sendMessage` 和 `Component` 的表演，“处理命令” 是 `setExecutor` 和 `->` 的探幽，而“查询延迟”是简单如 `p.ping` 一样的小菜……你已经习惯于 Kotlin 和 Bukkit 的强大，并对服务器上世界的运行有了更多的了解。

……这也就是产生问题的地方。在知道如何通过代码控制一切后，我们会容易忽视通过命令（或其它方式）与游戏交互的手段，而后者才是大多数玩家和管理员**与插件沟通的方式**。对你而言，“清空物品栏”就是 `sender.inventory.clear()` 这么简单，但对于管理员而言，他们会希望有诸如 `/clear-inventory Player` 这样的命令。

## 谋求共识

更学术地说，插件开发和服务器游玩使用着**两种不同的交互系统**，这就像语言一样：当你在 Kotlin 的世界摸爬滚打了很久之后，你已经熟练地把 Kotlin 当作你的 Minecraft “母语”来使用，但对于玩家而言，Kotlin 则完全是“何って言ったの？（你刚才说什么？）”这样的感觉。

在开发插件时，这样的问题是不能不处理的！所以，在编写完代码后，一定要仔细地检查一下插件功能，思考“我刚才是不是忽略了看上去很容易，但实际上游戏里面用不了的功能？”，否则辛辛苦苦做出来的插件，安装到服务器上却是差评连天，这会很令人沮丧。

现在来看看初始套装插件的功能表，很容易找到下面这两条重要而又缺失的功能：

- 获知某个玩家是否已经领取过套装
- 重置套装的领取状态

*大家可能会想，用 `/kit` 领取试试不就好了？但是玩家有可能只是想知道“我拿过这个了吗？”，而不是想要立刻领取套装。另外，如果作为管理员，想用这种方式查询其他玩家的领取状态，那就难办了！*

这两个功能都不难实现，以大家目前已知的知识，只要稍微想想就能写出来，所以我们就直接把代码放在这里了：

<details>
<summary>查看完整代码</summary>

```yaml
# 在 plugin.yml 中添加命令
commands:
    # ...
    kitchk:
      usage: /kitchk [Player]
      description: Checks if a player has claimed the kit.
    kitunc:
      usage: /kitunc [Player]
      description: Mark the player as unclaimed.
```

```kotlin
// kitchk 的处理
server.getPluginCommand("kitchk")?.setExecutor { sender, command, label, args ->
    val playerUUID = if (args.size < 1) {
        // 不带任何参数时，认为是查询执行命令的玩家
        if (sender is Player) {
            sender.uniqueId
        } else {
            // 如果是控制台查询，必须提供参数
            sender.sendMessage(Component.text("Player name required for console queries."))
            return@setExecutor true
        }
    } else {
        // 根据玩家名称获取 UUID
        server.getOfflinePlayerIfCached(args.first())?.uniqueId
    }

    // 只允许 OP 查询任意玩家，其他玩家只能查询自己
    if (sender is Player && !sender.isOp && playerUUID != sender.uniqueId) {
        sender.sendMessage(Component.text("Permission denied."))
        return@setExecutor true
    }

    if (playerUUID == null) {
        // 没找到该玩家
        sender.sendMessage(Component.text("Player not found."))
    } else {
        // 执行查询并显示结果
        val isKitted = kittedPlayers.contains(playerUUID)
        if (isKitted) {
            sender.sendMessage(Component.text("That player has claimed the kit."))
        } else {
            sender.sendMessage(Component.text("That player has not yet claimed the kit."))
        }
    }

    true
}
```

```kotlin
// kitunc 的处理
server.getPluginCommand("kitunc")?.setExecutor { sender, command, label, args ->
    // 只允许 OP 重置背包领取状态
    if (sender is Player && !sender.isOp) {
        sender.sendMessage(Component.text("Permission denied."))
        return@setExecutor true
    }

    // 检查命令参数，必须提供玩家名
    val playerName = args.firstOrNull() ?: run {
        sender.sendMessage(Component.text("Player name required."))
        return@setExecutor true
    }

    // 查询相应的 UUID
    val uuid = server.getOfflinePlayerIfCached(playerName)?.uniqueId ?: run {
        sender.sendMessage(Component.text("Player not found."))
        return@setExecutor true
    }

    // 重置状态
    kittedPlayers.remove(uuid)
    sender.sendMessage(Component.text("Player set to unclaimed."))

    true
}
```

</details>

这里用到了 `getOfflinePlayerIfCached`，它的作用是根据玩家名获取玩家的资料，其中包括了我们要使用的 UUID。除此之外我们还使用了 `return@xxx`，`?: run {}` 这样看上去有些奇怪的语法，这些将在后面的篇章中介绍。

---

OK，我们为插件添加了一些用于交互的命令，以便于玩家（和管理员）在游戏中直接与插件进行交互，而不需要编写代码、修改配置文件或者访问数据库什么的。这样我们的插件就比之前“好用了一点点”，在与市场上如此多的作品相提并论时，大家会觉得我们的东西更方便也说不定呢（笑）。

“让玩家能够访问插件功能”是我们从插件开发的第一天起就在做的事情，然而，要真正理解这句话的含义却很难做到。在这个例子里，如果只提供“领取套装”这样的功能，在管理上就不够方便，但若是为插件中每个变量都提供一个命令查询，又显然是过度为之。究竟要允许用户在何种程度上与我们的代码交互？这需要根据功能设计决定，或许还需要一点点经验。

到这里，关于初始套装的内容我们已经讲得足够多了，也许还有未尽的相关知识，不过那都将放在后面的章节中再讲述了。如果还需要更多关于细节的介绍，那么你可以查看这个项目的 [源代码](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/liftoff)。
