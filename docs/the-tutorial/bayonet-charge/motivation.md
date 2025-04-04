---
sidebar_position: 1
---

# 6-1 RPG 插件概述

## 魔学导论

常用的插件中有一大类是 **RPG 插件**，即为玩家添加各种原版中所不存在的技能（例如空中二段跳）或者状态（例如魔法值）。RPG 插件无疑是插件家族当中最吸引人的类型之一，不仅由于它们极强的表现力，更由于插件只能使用有限的资源，功能相对模组更加受限，因此能够有创意地利用既有的各种机制来设计 RPG 插件是一种非常令人羡慕的能力。

在这一章里，我们将制作一个可以帮助玩家打败监守者或者远古守卫者的插件：

> **刺刀冲锋（Bayonet Charge）**
>
> 当玩家在疾跑，并且手持指定的物品（例如铁剑）时，按下右键即可发动刺刀冲锋。
>
> - 冲锋期间移速大幅加快，并且受到的伤害减少。
> - 冲锋时间无限，但在停止疾跑、移动一定距离或撞上实体后将停止。
> - 由刺刀冲锋碰到的实体将受到大量伤害。
> - 根据已经冲刺的距离，刺刀冲锋结束后将进入冷却，期间玩家的速度将减慢，并且无法再次发动冲锋。

看上去就像这样：

![Charging](/img/contents/bayonet-charging.png)

*遗憾的是，由于笔者所用的 GIF 编码器实在太过糟糕，没办法将 GIF 压缩到足以放在我们的网站上的大小，真是对不起（笑）。*

当然，肯定有读者会说，“用剑什么的太 Low 了，看上去一点也不像刺刀”“只能击杀生物多没意思啊，要是碰上能爆炸就好了”，不过请大家先按捺下涌动的创意，跟着笔者来了解一些更基础的机制，例如如何显示上面的“进度条”，如何控制玩家的加减速等等。在学会运用这些基本知识后，要创建自定义的效果将是非常容易的。

## BOSS 状态条

在屏幕上方显示的“进度条”，对，就是那个红色的，带有标题的长条，叫做 **BOSS 状态条**。在挑战末影龙或者凋灵时，你肯定见到过它（那时应该是紫色的）。BOSS 状态条的信息存储在服务器，因此可以由玩家来自定义，这使得它非常适合用于制作各种技能值以及经验进度等。

Paper 提供了两套 API 来让我们使用 BOSS 状态条：

- **Bukkit 原版**：由 Bukkit 的开发者编写的，更古老的一组 API，像是自定义标题颜色一类的工作比较麻烦，但胜在可以支持更多“传统派”的服务器。
- **Adventure**：在 Paper 中集成的一套新 API，它能够更方便地设定标题的字体、颜色等，但这项 API 在 Spigot 等服务器上无法使用。

考虑到大多数现代的服务器都毫无保留地使用着 Paper 或者 Paper 的衍生产品，我们选用 Adventure API 来完成 BOSS 状态条的创建，对于其它可选的地方也是如此。如果你需要编写一个支持较老服务器的插件，可以在本书的高级部分找到一些帮助，不过在那之前，最好先试试升级一下服务器。

用 Adventure 来创建 BOSS 状态条非常简单，大致就像下面这样：

```kotlin
val bar = BossBar.bossBar(
    Component.text("我的超级大僵尸"),
    1f,
    BossBar.Color.RED,
    BossBar.Overlay.PROGRESS
)

player.showBossBar(bar)
```

`bossBar` 函数的具体用法我们将在实例中展示，读者只需要大致了解，“要提供一个标题，一个数字，还有一堆 `BossBar.XXX` 之类的东西”就可以了。`showBossBar` 方法向指定的玩家展示 BOSS 状态条。

## 状态效果

相信你对游戏中的各种状态效果一定不陌生：速度、力量、生命恢复等等都是状态效果。通过状态效果赋予玩家特定方面的增强或削弱，是 RPG 插件常用的手段，例如，要调整玩家速度比较困难，但借助速度和缓慢效果，我们就可以让 Minecraft “帮我们”考虑这些问题，使得问题大大简化。

Bukkit 为 `LivingEntity` 类（具备生命值的 `Entity`）提供了很方便的方法来施加状态效果：

```kotlin
e.addPotionEffect(
    PotionEffect(
        PotionEffectType.SPEED,             // 速度
        PotionEffect.INFINITE_DURATION,     // 持续时间无限
        2                                   // 等级 3（2 + 1）
    )
)
```

只需要构造一个 `PotionEffect` 对象描述状态效果，再将它传递给 `addPotionEffect`，即可将指定的效果应用到实体上。

---

上述的两种机制都很大程度上依赖于**枚举（Enum）** 的应用，例如 `BossBar.Color.RED`、`PotionEffectType.SPEED`，它们表示“一系列可能的值中的一个”，那具体什么是枚举呢？这就要放在下一节介绍了。