---
sidebar_position: 6
---

# 4-5 处理按钮事件

## 判断物品类型

物品的类型信息存储在它的 `type` 属性中，我们可以通过下面的代码来判断：

```kotlin
if (item.type == Material.BARRIER) {
    // 是屏障（对应重新部署）
}

if (item.type == Material.FIREWORK_ROCKET) {
    // 是烟花火箭（对应快速起飞）
}

// ...
```

但是像这样写很多 `if` 会很麻烦，Kotlin 提供了另一种方式来做相同的事情：

```kotlin
when (item.type) {
    Material.BARRIER -> {
        // 是屏障
    }

    Material.FIREWORK_ROCKET -> {
        // 是烟花火箭
    }

    Material.COMPASS -> {
        // 是指南针
    }

    Material.COMMAND_BLOCK -> {
        // 是命令方块
    }

    else -> {
        // 是其它东西
    }
}
```

`when` 将 `()` 内的值与 `{}` 列出的值从上到下逐个进行匹配，并执行**第一个匹配到的**值后跟随的 `{}` 中的代码，这比写一串 `if` 要方便得多。

接下来只要在各个 `{}` 内填入相应的代码就可以了！这么一想还是挺振奋人心的，那么我们就来看真正有趣的部分。

## 实现按钮功能

### 重新部署

重新部署也就是令玩家死亡并在重生点重生。由于重生是自动的，所以只需要令玩家死亡就可以了。你或许会想去调用 `kill` 命令，但在插件中，可以直接操作 `Player` 对象的生命值：

```kotlin
clicker.health = 0.0
```

系统会判定生命值为 0 的实体为死亡，这么做 OK。

### 快速起飞

在插件中，要操作玩家的运动，通常都是通过修改玩家的**动量（Velocity）**：

```kotlin
val vec = clicker.velocity                          // 获取动量值
vec.y += config.getDouble("liftoff.velocity", 5.0)  // 在 Y 轴上增加指定的那么多动量
clicker.velocity = vec                              // 重新设置玩家的动量
```

`getDouble` 方法从配置文件中获取类型为 `Double` 的值，即双精度小数。我们首先通过 `velocity` 取得动量，增加它 Y 轴上的值，再把它重新赋给 `velocity`，玩家就会受到一个“向上的力”（实际上是动量），从而向上飞起。`+=` 代表“向指定的值增加那么多东西”。

*`5.0` 对于动量而言是一个相当大的值，在只需要很少位移的时候，通常会使用 `0.5` 这样的值。另外即使值是整数，后面的 `.0` 也不能省略。*

:::info

为什么不能直接通过 `clicker.velocity.y` 来操作动量呢？哈，这就是 Getter 转换的问题了。`velocity` 属性对应 Java 中的 `getVelocity` 方法，但这个方法获取到的并不是动量对象本身，而是**它的一个副本**。如果直接通过 `clicker.velocity` 操作，改变的仅仅是那个复制品，必须在修改后对 `velocity` 属性重新赋值（实际上是调用 `setVelocity` 方法）才能“保存”修改。

不得不说，Kotlin 在这方面确实有一些误导性，因为它并不会真的检查 Getter 和 Setter 的实际功能，仅仅是通过名称来进行“猜测”。不过相比它带来的便捷性，这一点问题还是可以接受的。

:::

### 查询延迟

Bukkit 提供了 `Player.getPing()` 方法来获取延迟，在 Kotlin 中，通过 `Player` 对象的 `ping` 属性就可以获得。我们将延迟包装成消息发送给玩家：

```kotlin
clicker.sendMessage(Component.text("Ping: ${clicker.ping}ms"))
```

### 执行命令

要以玩家身份执行命令，只需要调用 `Player` 对象的 `performCommand` 方法：

```kotlin
clicker.performCommand(config.getString("command.run", "help")!!)
```

我们从配置文件中提取 `command.run` 指定的命令执行。这里使用 `help` 作为默认值，即如果管理员没有配置命令，那么就默认显示帮助信息。

## 关闭物品栏

一般来说，菜单按钮在点击一次后就会自动关闭。所以，在一切都完成后，我们需要关闭物品栏：

```kotlin
iv.close()
```

在这些都做完后，事件监听器的完整代码如下：

```kotlin
class EventHandlers(
    private val config: ConfigurationSection
) : Listener {

    @EventHandler
    fun onInventoryClick(ev: InventoryClickEvent) {
        val iv = ev.clickedInventory ?: return                  // 判断所点击物品栏是否为 null
        if (iv.holder is StartMenuInventoryHolder) {            // 判断是否是我们创建的物品栏
            val clicker = ev.whoClicked as? Player ?: return    // 获取点击物品栏的玩家

            val item = ev.currentItem ?: return                 // 获取被点击的物品
            ev.isCancelled = true                               // 防止物品被拿走

            when (item.type) {                                  // 根据物品类型执行操作
                Material.BARRIER -> clicker.health = 0.0

                Material.FIREWORK_ROCKET -> {
                    val vec = clicker.velocity
                    vec.y += config.getDouble("liftoff.velocity", 5.0)
                    clicker.velocity = vec
                }

                Material.COMPASS ->
                    clicker.sendMessage(Component.text("Ping: ${clicker.ping}ms"))

                Material.COMMAND_BLOCK ->
                    clicker.performCommand(config.getString("command.run", "help")!!)

                else -> {}
            }

            iv.close()      // 关闭物品栏
        }
    }
}
```

*我们稍微简化了一下 `when` 的用法，即如果 `->` 后只有一行，那么就可以去掉 `{}`。*

和以前的程序相比，代码长了不少，不过在前面的说明下，整体的逻辑应该还算清晰，不会有什么难以理解的地方。

接下来要做的事情就是增添命令处理器，以处理用户输入的 `/menu` 命令了。不过在此之前，让我们再稍微多了解一点 Kotlin 的另一特性……