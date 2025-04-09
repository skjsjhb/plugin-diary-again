---
sidebar_position: 5
---

# 6-4 从思绪到言辞

## 提取配置内容

由于我们的配置内容不会在插件运行时更改，因此根据上一章中的**提升不变变量**做法，我们可以先把需要的各种配置值都提取出来，作为 `BayonetChargeListener` 的属性存储：

```kotlin
private val chargingItems = config.getStringList("items").toSet()
private val maxDistance = config.getDouble("max-distance", 30.0)
private val killMsg = config.getString("kill-msg", "")!!
private val slownessDuration = config.getInt("slowness-duration", 100)
private val slownessAmplifier = config.getInt("slowness-amplifier", 3)
private val speedAmplifier = config.getInt("speed-amplifier", 2)
private val barTitle = config.getString("title", "刺刀冲锋")!!
```

要根据所需的数据类型选取合适的 `getXXX` 方法，例如在获取最大距离信息时，我们使用 `getDouble` 方法，因为距离可能不是完整的方块数，而在获取效果等级时，我们使用 `getInt` 方法，要求 Bukkit 将数据转换为 `Int`，因为像是“速度 2.5”这种东西就完全不合理嘛！

在提取了这些配置内容后，我们在事件处理函数内就可以直接使用这些属性，所以不再需要 `config` 对象了，也就是说，`config` 仅在属性初始化时使用，也就是**仅在构造函数中使用**（还记得吗，属性初始化是构造函数的一部分）。那么，我们可以把 `config` 对象从属性**降级**为普通构造函数参数：

```kotlin
class BayonetChargeListener(
    private val config: ConfigurationSection    // config 是一个属性，但是它只在构造函数中使用
) { /* ... */ }

class BayonetChargeListener(
    config: ConfigurationSection                // 去掉属性声明，将 config 转换成一个普通参数
) { /* ... */ }
```

## 存储冲锋状态

前面已经提到，我们可以使用**映射表**来存储玩家和冲锋状态（借用 `BossBar` 表示）之间的关联关系，这个关系在玩家交互和玩家移动事件处理函数中都要用到，所以也需要作为属性存储，于是我们新增 `chargingBar` 属性：

```kotlin
private val chargingBar = HashMap<UUID, BossBar>()
```

`HashMap` 是 Kotlin（和 Java）中众多不同种类的映射表之一。这里我们没有使用 `mutableMapOf`，而是直接使用 `HashMap` 的构造函数来构造一个映射表，这是因为 `mutableMapOf` 默认创建一个 `LinkedHashMap`，它不仅能记住键与值的关系，还能记住键之间的顺序关系。不过，我们不需要用到这一点，因此使用 `HashMap` 可以避免 `LinkedHashMap` 内部一些不必要的操作。

<details>
<summary>你是职业选手吗？</summary>

有经验的读者或许会认为应该使用 `ConcurrentHashMap` 来保持线程安全性，但实际上不需要这么做，因为 `chargingBar` 只由 `PlayerInteractEvent` 和 `PlayerMoveEvent` 的处理函数访问，它们都在主线程上运行（众所周知，Minecraft 是单线程游戏），所以不会出现竞争情况。

如果你在编写 Folia 插件，并且想要按区块处理玩家事件，就需要注意线程安全性了，因为 Folia 使用多个线程来运行游戏。

</details>

`<>` 内的内容是**类型参数（Type Parameter）**，我们会在后面具体讲解这一点。对于 `Map` 接口和它的实现类而言，`<>` 中包含 2 个参数，第一个是键的类型，第二个是值的类型。在这里，我们使用 `UUID` 作为键，`BossBar` 作为值。在 Bukkit 中，**每个实体都有独一无二的 UUID**，可以通过 `Entity` 的 `uniqueId` 属性取得，这用于标记某些数据“属于谁”非常有用。

:::info 少即是多

为何不直接使用 `Player` 作为键呢？从语法上来讲，这么做没什么问题，而且这样写出来的代码也是能运行的，但是大家要明白，`Map`（和 `MutableMap`）的性能很大程度上受到键的影响，键的内容越复杂，`Map` 的查找就越慢。一个 `Player` 对象所包含的信息是远多于 `UUID` 的，而二者都能独一无二地标识玩家，所以使用 UUID 作为键就比直接使用玩家对象作为键要好。

:::

## 冲锋的启动

### 冲锋启动条件

我们从监听 `PlayerInteractEvent` 开始，添加一个事件处理函数：

```kotlin
@EventHandler
fun onBeginCharge(ev: PlayerInteractEvent) {
    // 要做之事
}
```

回忆一下先前的设计，玩家要能够冲锋，必须满足以下条件：

- 不能已经在冲锋
- 当前在疾跑
- 手持指定的物品
- 身上没有缓慢效果
- 用右键交互

### 避免重复启动

首先来看看如何判定玩家是否已经在冲锋，这很简单，只需要看看 `chargingBar` 中是否**已经有玩家所对应的 `BossBar`**：

```kotlin
if (chargingBar.containsKey(ev.player.uniqueId)) return
```

`containsKey` 方法能告诉我们指定的键是否存在，我们通过 `ev.player.uniqueId` 取得玩家的 UUID，再通过 `chargingBar` 这个映射表查询，如果有结果，`containsKey` 返回 `true`，那么我们就离开函数。

### 获取疾跑状态

判定玩家是否在疾跑很简单，Bukkit 已经提供了相应的属性 `isSprinting`：

```kotlin
if (!ev.player.isSprinting) return
```

### 获取手持物品

通过 `PlayerInteractEvent` 的 `item` 属性可以取得触发这个交互所用的物品，进而可以获取其类型。判定物品类型和上一章中判定实体类型一样，我们要通过 `type.key.toString()` 获取物品的**命名空间 ID**，再使用 `contains` **查询**该命名空间 ID 是否在 `chargingItems` 配置值中：

```kotlin
if (!chargingItems.contains(ev.item?.type?.key?.toString())) return
```

`?.` 是**安全访问运算符（Safe Call Operator）**，它和直接用 `.` 访问属性和方法基本一样，但是它可以对 `null` 值使用，如果对象值不是 `null`，它就和 `.` 一样访问指定的属性和方法，如果对象值是 `null`，那么 `?.` 就什么也不做，简单把这个 `null` 值“传递”下去。

如果玩家手中没有任何物品，`ev.item` 的值就是 `null`，连带着后面的 `type`、`key` 都有可能是 `null`，所以我们连续使用三次 `?.` 运算符，获得命名空间 ID 字符串。

这一连串 `?.` 的结果，要么是物品的命名空间 ID，要么是 `null`，而 `chargingItems` 中肯定不含有 `null`，所以我们通过 `contains` 检测该命名空间 ID 是否是指定的物品之一，如果不是，就离开函数。

:::note

`getStringList` 与 `getString` 不同，当遇到无法读取的值时，它简单将其忽略，而不会在返回的列表中包含 `null`。

:::

### 获取状态效果

Bukkit 提供了 `hasPotionEffect` 方法来判定实体是否已经具有指定名称的药水效果，我们只需要传递 `PotionEffectType.SLOWNESS` 作为参数就可以：

```kotlin
if (ev.player.hasPotionEffect(PotionEffectType.SLOWNESS)) return
```

`PotionEffectType` 枚举类描述了游戏中所有的状态效果类型，你可以在按下 <kbd>Ctrl</kbd> 的同时单击它的名字，就能让 IDEA 为你展示其内容（不过遗憾的是，类的内容是用 Java 写的）。

### 获取鼠标按键

`PlayerInteractEvent` 的 `action` 属性包含了这次交互的按键信息，它的类型是 `org.bukkit.event.block.Action`，后者同样是一个枚举类，所以只需要比较一下这次事件的 `action` 是否是右键点击：

```kotlin
if (ev.action != Action.RIGHT_CLICK_AIR) return
```

`Action` 枚举类中的 `RIGHT_CLICK_AIR` 代表“右键点击空气”。

### 添加状态效果

在上述的判定都通过后，我们就可以利用 `addPotionEffect` 方法和 `PotionEffect` 的构造函数来为玩家**添加一个速度效果**：

```kotlin
ev.player.addPotionEffect(
    PotionEffect(
        PotionEffectType.SPEED,             // 速度
        PotionEffect.INFINITE_DURATION,     // 持续时间无限
        speedAmplifier                      // 效果等级
    )
)
```

`PotionEffect` 的构造函数接受三个参数：

- 第一个参数从 `PotionEffectType` 中取值，代表效果类型。
- 第二个参数是持续时间，这里实际上是一个数字，代表状态效果的持续时间（单位为刻）。`PotionEffect.INFINITE_DURATION` 只是一个方便记忆的名字而已，它的值是 `-1`，用来表示持续时间无限。
- 第三个参数为效果等级，这里传入的等级是游戏内显示的等级 -1，也就是说，“速度 IV” 对应的等级是 3。

虽然我们为玩家添加了持续时间无限的速度效果，不过这个效果只会在冲锋的时候存在，我们会在冲锋结束的时候将它清除。

### 创建 BOSS 状态条

Adventure API 提供了 `BossBar.bossBar` 方法创建一个新的 `BossBar`：

```kotlin
val bossBar = BossBar.bossBar(
    Component.text(barTitle),   // 标题，使用配置中的值
    1f,                         // 初始进度是满的
    BossBar.Color.RED,          // 红色
    BossBar.Overlay.PROGRESS    // 不分段
)
```

:::warning 你的名字

Bukkit 中有两个不同的 `BossBar` 类，一个是我们用到的 `net.kyori.adventure.bossbar.BossBar`，另一个则是更老的由 Bukkit 提供的 `org.bukkit.boss.BossBar`，在导入时请一定要选择正确的包。

:::

四个参数的作用分别是：

- 标题，和聊天信息什么的一样，这里也需要提供一个**组件**，我们可以用 `Component.text` 来创建。
- 初始进度，取值是 `0f` 至 `1f`。
- 颜色，从 `BossBar.Color` 枚举类中取值。
- 分段数，从 `BossBar.Overlay` 枚举类中取值。状态条可以是连续的，或者分作几段，这都是视觉上的效果，不会对进度值产生任何影响。

:::note

`1f` 的后缀 `f` 代表**创建一个 `Float` 类型的小数**。在 Kotlin 中，小数有两种，分别是 `Float` 和 `Double`。`Double` 的精度比 `Float` 高，但也需要使用更多的内存。取决于所需的精度，Bukkit（和其它 Java 程序）有时会采用 `Float` 来存储数据，`BossBar` 的进度是其中一例。

Kotlin 中的小数默认是 `Double` 类型，整数默认是 `Int` 类型，必须在后面加上 `f`，Kotlin 才会知道我们想表示一个 `Float` 类型的数。

:::

当创建了 BOSS 状态条后，我们就可以将它对玩家**显示**，同时将它和玩家信息一并**登记**到我们的映射表 `chargingBar` 中：

```kotlin
ev.player.showBossBar(bossBar)              // 显示 BOSS 状态条
chargingBar[ev.player.uniqueId] = bossBar   // 设置玩家的 UUID 对应刚才创建的 BOSS 状态条
```

### 完整的冲锋启动代码

把上面的所有东西都放在一起，我们就得到了 `onBeginCharge` 的完整代码：

```kotlin
@EventHandler
fun onBeginCharge(ev: PlayerInteractEvent) {
    // 判定各种条件
    if (ev.action != Action.RIGHT_CLICK_AIR) return
    if (!ev.player.isSprinting) return
    if (ev.player.hasPotionEffect(PotionEffectType.SLOWNESS)) return
    if (!chargingItems.contains(ev.item?.type?.key?.toString())) return
    if (chargingBar.containsKey(ev.player.uniqueId)) return

    // 添加速度效果
    ev.player.addPotionEffect(
        PotionEffect(
            PotionEffectType.SPEED,
            PotionEffect.INFINITE_DURATION,
            speedAmplifier
        )
    )

    // 创建和登记 BOSS 状态条
    val bossBar = BossBar.bossBar(
        Component.text(barTitle),
        1f,
        BossBar.Color.RED,
        BossBar.Overlay.PROGRESS
    )

    ev.player.showBossBar(bossBar)
    chargingBar[ev.player.uniqueId] = bossBar
}
```

我们重新排列了一下开头的五个 `if`，将简单的操作（如读取事件的信息）放在复杂的操作（如查询 UUID）之前，这样我们可以尽量确保那些复杂的操作只在必要的时候才执行。

## 冲锋的停止

### 冲锋停止条件

现在把目光放到 `PlayerMoveEvent` 上，我们将在这里计算冲锋距离，判断冲锋停止条件，以及处理实体碰撞。新增一个事件处理函数：

```kotlin
@EventHandler
fun onChargeUpdate(ev: PlayerMoveEvent) {
    // 要做之事……
}
```

### 获取当前冲锋状态

由于世界中的其他玩家也可能随时在移动，因此必须先判定当前玩家是否正在冲锋。要做到这一点很简单，只需要查询 `chargingBar` 中是否有和玩家相关的 `BossBar`：

```kotlin
val bb = chargingBar[ev.player.uniqueId] ?: return
```

我们一步到位，在查询的同时也把查到的值提取出来。`[]` 用作查询的时候，如果指定的键不存在，它会返回 `null`，我们再通过 `?:` 运算符确保**只有当玩家对应的 `BossBar` 存在时**，才将它赋给 `bb` 并继续。

### 停止冲锋的逻辑

在停止疾跑、碰到实体或者距离耗尽后，玩家的冲锋会停止，在这三种情况下，我们都需要为玩家附加缓慢效果，并删除相应的 `BossBar`。为此，我们可以先**编写一个函数**，将停止冲锋要做的事情提取出来：

```kotlin
fun endCharge() {
    ev.player.removePotionEffect(PotionEffectType.SPEED)
    ev.player.addPotionEffect(
        PotionEffect(
            PotionEffectType.SLOWNESS,
            (slownessDuration * (1 - bb.progress())).toInt(),
            slownessAmplifier
        )
    )
    ev.player.hideBossBar(bb)
    chargingBar.remove(ev.player.uniqueId)
}
```

这个函数直接写在 `onChargeUpdate` 事件处理函数中，因此它可以直接访问在外层定义的参数 `ev`。

我们首先清除已有的速度效果，然后附加一个缓慢效果。缓慢效果的时间与已经冲锋的距离相关，也就是说，如果玩家只冲锋了一小段距离就停下，那么我们希望让冷却时间短些。`1 - bb.progress()` 获取 BOSS 状态条“已经消耗”的进度值，我们再将它乘上最大冷却时间，就得到这次冲锋适用的冷却时间。`toInt` 方法将乘法的结果转换为整数刻数。

`hideBossBar` 方法从玩家的界面中删除指定的 BOSS 状态条。

最后，我们将玩家的 UUID 从 `chargingBar` 中删除（通过 `remove` 方法），这样玩家的这次冲锋处理就结束了，`chargingBar` 中不再有玩家的信息，一切就回到了最开始的状态。

### 判断疾跑状态

当玩家停止疾跑时，我们就让玩家停止冲锋，使用上面编写的 `endCharge` 函数，这很容易做到：

```kotlin
if (!ev.player.isSprinting) {
    endCharge()
    return
}
```

### 判断实体碰撞

现在我们来实现冲锋击杀的功能，通过 `getNearbyEntities` 获取玩家附近的实体：

```kotlin
val entities = ev.player.getNearbyEntities(0.5, 0.5, 0.5)
```

我们在 XYZ 轴上各以半径 0.5 寻找实体，这个值不能过大，否则一是会对服务器运算造成负担，二是容易出现奇怪的行为（例如“隔墙创人”等）。

接下来我们从这些实体中找到第一个**生物实体**：

```kotlin
val target = entities.find { it is LivingEntity } as LivingEntity?
```

这是因为在 Minecraft 中，除了僵尸、鸡这样的生物，还有矿车、移动的方块、激活的 TNT 等特殊实体，后者没有生命值之谈，所以将它们排除在刺刀冲锋之外才合理。**所有的生物实体都实现 `LivingEntity`**，所以我们可以用 `is` 来判断。

`find` 方法接受一个 Lambda，它在列表中**寻找第一个**满足条件（即使得 `{ it is LivingEntity }` 返回 `true`）的元素，如果没有这样的元素，它返回 `null`。

查找到结果后，我们还要进行一次 `as` 转换，因为 `find` 返回的类型为**列表中的原始类型**，即 `Entity`，但我们希望 `target` 的类型是 `LivingEntity`，因为我们的 Lambda 中已经描述了这一点。`LivingEntity?` 最后的 `?` 允许该转换接受 `null` 值。

如果找到了这样的实体，就可以对它造成伤害，并结束冲锋，同时向玩家**发送一条消息**：

```kotlin
if (target != null) {
    ev.player.attack(target)    // 让玩家做出攻击动作
    target.health = 0.0         // 清空生命值
    ev.player.sendMessage(
        Component.text(killMsg.replace("{name}", target.name))  // 发送消息
    )
    endCharge()
    return
}
```

`replace` 方法将原始字符串中**指定的部分替换成新的内容**，在这里我们把 `{name}` 替换成被击杀生物的名称，这叫做**占位符**替换。

:::tip 术语库

**占位符（Placeholder）** 可以简单理解为填空题中的**空**，不过是带有名字的。如果字符串中的某些部分无法在编写字符串时进行确定，就可以使用占位符，稍后可以通过字符串**替换**将占位符换成实际的内容。

在配置文件中，用户不可能知道玩家击杀了什么生物，因此我们与用户约定：使用 `{name}` 这样的符号进行**占位**，我们的插件会将它替换成合适的内容。你也可以使用 `%name%`、`$name` 等占位符，这说到底只是个人喜好。

:::

### 计算剩余距离

如果玩家既没有停止疾跑也没有撞上实体，那么我们就该**更新剩余的冲锋距离**了。

我们首先获得玩家这次移动的距离：

```kotlin
val dis = ev.from.distance(ev.to)
```

`ev.from` 和 `ev.to` 的类型是 `Location`，包含着起终点的坐标，`distance` 方法计算当前坐标到目的坐标的距离。

我们同时也能通过 `bb.progress()` 计算出剩余的可用距离：

```kotlin
val remainingBlocks = bb.progress() * maxDistance
```

如果 `dis` 比 `remainingBlocks` 还大，那么在这次移动中，玩家已经**耗尽了冲锋距离**，于是我们就取消冲锋：

```kotlin
if (remainingBlocks <= dis) {
    endCharge()
    return
}
```

否则，我们减去 `dis` 那么多距离，然后将剩余距离除以最大冲锋距离，以得到**新的进度值**，并设置到 `bb` 中：

```kotlin
bb.progress(((remainingBlocks - dis) / maxDistance).toFloat())
```

`progress` 方法既能用来读取进度也能用来设置进度，当向它提供一个参数时，它设置进度，否则它就返回当前的进度。`toFloat` 方法将结果转换为 `Float`。

### 完整的冲锋停止代码

把上面的所有东西都放在一起，我们就得到了 `onChargeUpdate` 的完整代码：

```kotlin
@EventHandler
fun onChargeUpdate(ev: PlayerMoveEvent) {
    // 提取 BOSS 状态条
    val bb = chargingBar[ev.player.uniqueId] ?: return

    fun endCharge() {
        ev.player.removePotionEffect(PotionEffectType.SPEED)
        ev.player.addPotionEffect(
            PotionEffect(
                PotionEffectType.SLOWNESS,
                (slownessDuration * (1 - bb.progress())).toInt(),
                slownessAmplifier
            )
        )
        ev.player.hideBossBar(bb)
        chargingBar.remove(ev.player.uniqueId)
    }

    // 是否停止疾跑？
    if (!ev.player.isSprinting) {
        endCharge()
        return
    }

    // 是否撞上实体？
    val entities = ev.player.getNearbyEntities(0.5, 0.5, 0.5)
    val target = entities.find { it is LivingEntity } as LivingEntity?
    if (target != null) {
        ev.player.attack(target)
        target.health = 0.0
        ev.player.sendMessage(Component.text(killMsg.replace("{name}", target.name)))
        endCharge()
        return
    }

    // 计算剩余距离
    val dis = ev.from.distance(ev.to)
    val remainingBlocks = bb.progress() * maxDistance

    // 是否耗尽距离？
    if (remainingBlocks <= dis) {
        endCharge()
        return
    }

    bb.progress(((remainingBlocks - dis) / maxDistance).toFloat())
}
```

---

这一节可真是 —— 长！这主要是因为我们要在一个监听器内处理 BOSS 状态条、玩家运动、实体碰撞判断等多种功能，逻辑上比较琐碎，不过整体代码其实不长（不到 100 行），非常希望大家能自行编写，不过要是真心想偷懒复制粘贴，那就请君自便（笑）。

本节的内容，大家只需了解个大概，知道“哦，要对玩家登记数据，判断开始和结束什么的”就足够了，剩下的那些代码，无非只是调用了一堆函数，以及简单的加减乘除而已。所用到的各种方法，我们也没有给出详细的方法签名，大家只要能大概明白“哦，有这么个 `bossBar` 方法，参数是标题、进度、分段什么的”就已经非常好了。在实际编写更复杂的插件的时候，你可以随时去查阅文档，了解 Bukkit（和 Paper）都提供了哪些有用的功能来实现你的设计。