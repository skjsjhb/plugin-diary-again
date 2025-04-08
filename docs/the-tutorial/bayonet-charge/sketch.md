---
sidebar_position: 3
---

# 6-2 创建和初始化项目

## 插件信息与配置文件

在 IDEA 中创建新项目，然后进行必要的初始化过程，这些你都已经了然于心了，对吧？

我们所使用的 `plugin.yml` 如下：

```yaml
name: BayonetCharging
author: skjsjhb
description: Charge and dash with an iron sword on your hand!
website: https://bpd.skjsjhb.moe/docs/the-tutorial/bayonet-charge/sketch
main: Main
version: 1.0
api-version: 1.21
```

`config.yml` 如下：

```yaml
# 控制插件是否启用
enabled: true

# 可触发冲锋的物品
items:
  - minecraft:iron_sword

# 速度等级
speed-amplifier: 2

# 最大冲锋距离
max-distance: 30

# 冲锋结束后的缓慢效果等级
slowness-amplifier: 2

# 冲锋结束后的缓慢效果时间
slowness-duration: 100

# 冲锋体力条显示的文字
title: 刺刀冲锋 - 停止疾跑以取消

# 冲锋击杀发送的消息
kill-msg: 你使用刺刀冲锋击杀了 {name}
```

注意到我们在配置文件中增加了注释，YAML 中的注释以 `#` 开头，直至当前行的末尾结束。尽管我们的程序不会读取这些注释，但它们能帮助服务器管理员了解配置文件中各个条目的功能。

## 编写初始代码

在以前，我们一直都把事件处理的代码和插件主类放在一起，随着事件处理代码的增加，这个文件会越来越大，这时就有必要将事件处理代码**挪到单独的文件中**。通常而言，一个类**存放在一个单独的文件中**，这样当我们需要改变代码的某一部分时，只要在相应的文件中寻找就好了。

在 `src/main/kotlin` 下创建新文件（<kbd>New</kbd> <kbd>Kotlin Class/File</kbd>），并给它取名，用来存放监听器类。之前我们一直在用 `EventHandlers` 这个名字，这听上去有点“小明小红”的味道，现在是时候给我们的监听器类一个正式的名字了 —— 就叫它 `BayonetChargeListener` 如何？

*当然，你也可以随意使用其它的名字，但不要是 `shi件监听qi` 这种 —— 太糟糕了！*

编辑新创建的文件 `BayonetChargeListener.kt`，做法和以前一样：实现 `Listener`，传递 `config`（稍后会用到）。不过是换了个文件做这样的事情，应该没什么难的吧？

```kotlin
import org.bukkit.configuration.ConfigurationSection
import org.bukkit.event.Listener

class BayonetChargeListener(private val config: ConfigurationSection) : Listener {
    // 事件处理函数
}
```

现在回到 `Main.kt` 中，并在 `onEnable` 中添加启动代码：

```kotlin
override fun onEnable() {
    saveDefaultConfig()
    if (config.getBoolean("enabled")) {
        server.pluginManager.registerEvents(BayonetChargeListener(config), this)
    }
}
```

我们居然可以直接使用其它文件中的 `BayonetChargeListener` 类！好吧，这没什么稀奇的，Kotlin 允许**在同一个包内的类互相访问彼此**，由于我们的 `Main` 和 `BayonetChargeListener` 都不属于任何包，所以 Kotlin 认为它们“是一家人”，`Main` 可以直接使用 `BayonetChargeListener`，而不需要 `import` 或者什么其它特殊的设置。

:::note 三人为众

在大型的项目中，**代码拆分（Code Splitting）** 是组织和管理代码的重要步骤之一。合理地拆分代码可以避免“在 1536 行代码中找到出问题的函数”这种令人抓狂的情况。

:::

由于这次的插件没有实时启停的需要（像这种扩展游戏内容的插件通常不需要频繁启用和停用），因此我们使用传统的方法，在注册监听器前检查插件是否启用。