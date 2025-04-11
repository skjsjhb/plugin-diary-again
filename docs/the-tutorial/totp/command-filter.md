---
sidebar_position: 4
---

# 8-4 阻止未授权命令

让我们先来完成插件的第一个功能：**玩家未验证时，禁止执行除 `/totp` 之外的命令**。

## 白名单标记

当玩家初始加入服务器的时候，他们都是未授权的，只有当玩家经过了 TOTP 验证后，我们才允许其执行命令。

实现这一点最好的方式是创建一个 Set，记录已经验证的玩家：

```kotlin
private val authenticatedPlayers = HashSet<UUID>()
```

和先前一样，我们通过 UUID 标识玩家。

这样，一开始，玩家是不在这个“白名单”中的，验证成功后才会加入白名单。只要查询 `authenticatedPlayers`，就可以知道玩家是否已经通过验证。

:::info 必要时忘记

为何不使用 PDC 来标记玩家是否已经验证过呢？因为 PDC 中的数据是持久的，即使服务器重启也会保持原样，但是，在 TOTP 插件中，我们希望白名单是一次性有效的，当服务器重启后，新加入的玩家应当重新验证。

:::

当玩家退出服务器时，我们需要将其移出白名单，撤销其授权。为此，我们监听 `PlayerQuitEvent` 并进行相应的处理：

```kotlin
@EventHandler
fun onPlayerQuit(ev: PlayerQuitEvent) {
    authenticatedPlayers.remove(ev.player.uniqueId)
}
```

## 拦截命令事件

Bukkit 会将命令发给对应的 `CommandExecutor` 执行，例如，玩家执行 `/totp` 命令时，Bukkit 会把相关的数据发给我们通过 `setExecutor` 添加的事件处理函数。你或许会想，如果能够找出所有这样的命令处理函数，并对它们做一些修改，就可以拦截命令。不过实际上不需要这么麻烦，Bukkit 考虑到了拦截命令这样的需求，并提供了一个事件来帮助我们。

Bukkit 在收到了玩家的命令后，会首先触发一个 `PlayerCommandPreprocessEvent` 事件，我们可以通过监听这个事件访问命令的相关信息，拦截命令自然也不在话下：

```kotlin
@EventHandler
fun onPlayerCommand(ev: PlayerCommandPreprocessEvent) {
    // 提取命令的名称
    val commandName = ev.message.drop(1).takeWhile { it != ' ' }
    
    // 检查命令是否可用
    if (!authenticatedPlayers.contains(ev.player.uniqueId) && commandName != "totp") {
        // 拦截命令
        ev.isCancelled = true

        // 提示玩家
        ev.player.sendMessage(Component.text("您必须经过 TOTP 验证，才能使用命令。"))
    }
}
```

第一行代码从命令中提取**命令的名称**：去掉命令的前缀 `/`，然后向后查找，直到遇到空格或者命令的结尾。例如，如果执行的命令是 `/say ciallo`，那么 `commandName` 的值就是 `say`。像这样的字符串操作属于 Kotlin 的高级内容，我们将在本书的后面部分做进一步的介绍。

接下来我们就检查**是否需要拦截该命令**，即以下两个条件：

- 玩家不在白名单中
- 命令名称不是 `totp`

Set 的 `contains` 方法告诉我们它是否包含指定的 UUID。

如果我们发现命令需要拦截，那么就将 `isCancelled` 设为 `true`，这样 Bukkit 就不会继续执行该命令。随后，我们告知玩家这条命令已被阻止。
