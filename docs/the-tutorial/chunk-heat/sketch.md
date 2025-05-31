---
sidebar_position: 2
---

# 5-2 创建和初始化项目

## 插件信息

像以前一样创建一个新项目，并填写下面的 `plugin.yml`：

```yaml
name: ChunkHeat
author: skjsjhb
description: Reduce lag caused by mob farms.
website: https://bpd.skjsjhb.moe/docs/the-tutorial/chunk-heat/sketch
main: Main
version: 1.0
api-version: 1.21
```

由于我们的插件需要提供“实时启停”的功能，因此肯定还需要添加命令，所以再添加如下的内容：

```yaml
commands:
  chunk-heat:
    usage: /chunk-heat <enable|disable>
    description: Enable or disable chunk heat calculation.
```

这样管理员可以通过 `/chunk-heat disable` 来暂时停用插件。

## 配置文件

`config.yml` 设计如下：

```yaml
enabled: false
mobs:
  - "minecraft:zombie"
  - "minecraft:creeper"
  - "minecraft:skeleton"
overheat: 256
cooldown: 200
```

`mobs` 是插件要检测的生物类型，以命名空间 ID 描述。在插件开发中，这种“正式名称”，像是物品类型、方块类型、进度名称以及其它各种键的内容，几乎都是以命名空间 ID 的格式存储和交换的。在未来，如果你想要描述一系列物品类型，不要忘了使用命名空间 ID 哦（笑）！

`overheat` 是在触发冷却前最多生成的生物数，而 `cooldown` 是冷却时间，单位为**服务器游戏刻**。在 Minecraft 中，与游戏相关的计时工作，最好都使用刻来完成，这样如果服务器因为负载过高而卡顿，我们的插件不会因为服务器太慢而“跑得太快”。

一开始，所有的区块都是“冷”的，区块内生成生物时，该区块的热量会增加，当它超出了 `overheat` 后，在 `cooldown` 那么多时间内，这个区块内就不会再生成指定的生物。请大家记住这个**算法（Algorithm）**，这样就不至于在编写代码时晕头转向：“诶，到底是要增加还是减少啊？”

## 初始代码

现在，向 `Main.kt` 中添加代码，并创建监听器类：

```kotlin
import org.bukkit.configuration.ConfigurationSection
import org.bukkit.event.EventHandler
import org.bukkit.event.Listener
import org.bukkit.event.entity.EntitySpawnEvent
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
        server.pluginManager.registerEvents(EventHandlers(config), this)
    }
}

class EventHandlers(private val config: ConfigurationSection) : Listener {
    @EventHandler
    fun onMobSpawn(ev: EntitySpawnEvent) {
        if (!config.getBoolean("enabled")) {
            // 要做之事……
        }
    }
}
```

和以前做的差不多，只不过我们把“判断插件是否启用”移动到事件处理函数中了，因为管理员可以实时启停插件，而 Bukkit 在事件注册后就不能取消，所以我们只好**先注册**事件处理函数，再**根据配置决定**要不要执行。

在这个方法中，我们监听了 `EntitySpawnEvent`，这个事件会在**任何**实体被创建的时候触发，而我们只关心管理员指定的那些实体，所以等会肯定还要再做处理。

不过像这样把一堆东西塞到 `config.getBoolean("enabled")` 后面的 `{}` 里看上去很不美观，更好的办法是把 `onMobSpawn` 方法中的内容改成这样：

```kotlin
if (!config.getBoolean("enabled")) return

// 要做之事……
```

功能上没有变化，我们先检查插件是否启用，如果禁用就直接退出函数，逻辑上和“如果启用，就做这些事”是一样的，但代码上就稍微美观些。