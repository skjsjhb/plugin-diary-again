---
sidebar_position: 4
---

# 5-4 优化事件处理代码

## 记忆是个糟糕的东西

还记得我们在上一节中使用 PDC 来存储数据吗？PDC 有一个很好的性质，就是存储在其中的数据**保存在它的“宿主”中**，即使在重启服务器后也不会失效。存放在区块中的数据只有在世界被重置后才会消失，存放在实体中的数据在实体被删除后才会消失，以此类推。

这会引发一个问题，我们使用 PDC 来存储“区块上次过热的时间”，但是，`Bukkit.getCurrentTick` 方法获取的是服务器**自启动后经过的刻数**，也就是说，每次重启过后，Bukkit 这边的时间线重置了，但是我们存储在区块中的过热时间可没有！这会造成一些混乱，假设区块的冷却时间是 200 刻，那么想象下面的情况：

1. 在服务器第 600 刻的时候，某个区块过热了，我们在 PDC 中登记 `600` 这个信息。
2. 出于某些原因，服务器需要重启。
3. 服务器重启后，刻数重置为 0，当服务器又运行了 200 刻的时候，这个区块理应冷却完成了，可是 PDC 中登记的值还是 `600`，所以我们不得不等到第 800 刻的时候（也就是又过去 600 刻），区块才能正常生成实体！

这是很糟糕的漏洞，而且我们在编写代码时并不容易看出这一点，只有对 `Bukkit.getCurrentTick` 的特性足够了解的人才能一眼发现代码中的问题。如果这样的插件被部署到真正的服务器上，那毫无疑问是一场灾难！

这个问题的解决方法之一是在 PDC 中登记一个**会话 ID（Session ID）**，并且在存储过热时间数据的时候一并存储。每次服务器启动时，插件随机生成一个会话 ID，在读取过热时间时，将存储的会话 ID 与当前的会话 ID **进行比较**，如果二者不一致，就认为服务器重启过了，因而 PDC 中存储的数据无效，应该删除它们。

要实现这一点并不困难，只需要稍微修改一下代码。首先，我们需要在每次服务器启动时生成不同的会话 ID，我们可以在 `EventHandlers` 中增加一个属性：

```kotlin
class EventHandlers(private val config: ConfigurationSection) : Listener {
    // 增加这一行
    private val sessionId = UUID.randomUUID().toString()

    // ...
}
```

由于 `EventHandlers` 只在**插件启动的时候被创建一次**，因此 `sessionId` 对于服务器任何一次运行来说都是全新的，并且在服务器运行的整个过程中保持不变。

`UUID.randomUUID` 方法生成一个新的 UUID，和 `NamespacedKey` 一样，`UUID` 本身也是一个内部结构，要通过 `toString` 将它转换成字符串。

:::tip 术语库

**通用唯一识别码（Universally Unique Identifier，UUID）** 是一种可以方便地生成的编号，例如 `0195fd50-d8ab-7b47-ab22-1482b8e4913c`。UUID 的生成依赖于随机性，而且几乎不可能重复。在不牵涉秘密信息的场合，用 UUID 来标识信息是再合适不过了。

:::

当生成了 `sessionId` 后，我们可以创建相应的键，并在读取热量值和过热时间之前，先**检查会话 ID 是否有效**：

```kotlin
val sessionIdKey = NamespacedKey.fromString("chunk_heat:session")!!

val storedSessionId = chunk.persistentDataContainer.get(sessionIdKey, PersistentDataType.STRING) ?: ""
if (storedSessionId != sessionId) {
    chunk.persistentDataContainer.remove(heatKey)
    chunk.persistentDataContainer.remove(lastOverheatTimeKey)
    chunk.persistentDataContainer.set(sessionIdKey, PersistentDataType.STRING, sessionId)
}
```

读者请先自行思考一下，这些代码应当插入在事件处理函数的什么位置。我们从 PDC 中读取区块当前存储的会话 ID，并与插件生成的 `sessionId` 进行比较，如果二者不一致，就通过 `remove` 方法，从 PDC 中**删除**这些值，然后将会话 ID **修正**为当前的会话 ID。

完成的代码看上去像这样，不过在展开之前，希望大家自行尝试一下 —— 这并不困难！

<details>
<summary>我已经试过了！</summary>

完整的 `EventHandlers` 类如下：

```kotlin
class EventHandlers(private val config: ConfigurationSection) : Listener {
    private val sessionId = UUID.randomUUID().toString()

    @EventHandler
    fun onMobSpawn(ev: EntitySpawnEvent) {
        if (!config.getBoolean("enabled")) return

        val entities = config.getStringList("mobs")

        if (!entities.contains(ev.entity.type.key.toString())) return

        val chunk = ev.entity.chunk
        val heatKey = NamespacedKey.fromString("chunk_heat:heat")!!
        val lastOverheatTimeKey = NamespacedKey.fromString("chunk_heat:last_overheat")!!
        val sessionIdKey = NamespacedKey.fromString("chunk_heat:session")!!

        val storedSessionId = chunk.persistentDataContainer.get(sessionIdKey, PersistentDataType.STRING) ?: ""
        if (storedSessionId != sessionId) {
            chunk.persistentDataContainer.remove(heatKey)
            chunk.persistentDataContainer.remove(lastOverheatTimeKey)
        }

        val prevHeat = chunk.persistentDataContainer.get(heatKey, PersistentDataType.INTEGER) ?: 0
        val lastOverheatTime = chunk.persistentDataContainer.get(lastOverheatTimeKey, PersistentDataType.INTEGER) ?: 0

        if (Bukkit.getCurrentTick() < lastOverheatTime + config.getInt("cooldown")) {
            ev.isCancelled = true
            return
        }

        val newHeat = prevHeat + 1
        if (newHeat >= config.getInt("overheat")) {
            chunk.persistentDataContainer.set(
                lastOverheatTimeKey,
                PersistentDataType.INTEGER,
                Bukkit.getCurrentTick()
            )
            chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, 0)
            chunk.persistentDataContainer.set(sessionIdKey, PersistentDataType.STRING, sessionId)
        } else {
            chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, newHeat)
        }
    }
}
```

</details>

这样我们就修复了这个漏洞，可喜可贺！

## 0 不是那么完美

我们的插件中还存在另一个漏洞，这是因为我们对 `lastOverheatTime` 的处理比较偷工减料：如果 PDC 中没有最近过热时间的信息，我们就**认为最近一次过热是在 0 刻时发生的** —— 这其实有点问题，会导致在服务器启动的一段时间内，由于插件误以为区块“仍然在冷却中”，所以无法生成实体。

也许更好的方法是不将 `lastOverheatTime` 的值默认为 `0`，而是单独处理这个值为 `null` 的情况：

```kotlin
// 去掉默认值 0
val lastOverheatTime = chunk.persistentDataContainer.get(lastOverheatTimeKey, PersistentDataType.INTEGER) /* ?: 0 */

// 在 if 中单独处理 null 的情况
if (lastOverheatTime != null && Bukkit.getCurrentTick() < lastOverheatTime + config.getInt("cooldown")) {
    // ...
}
```

在做了这个修改后，相应的漏洞也就修复完成。

## 重用资源

请大家把目光挪到一系列 `NamespacedKey.fromString` 当中来，`NamespacedKey` 对象并不是一次性的，可以反复使用。尽管通过 `fromString` 构造命名空间并不会消耗太多 CPU 时间，但会产生一堆不必要的对象，这会让垃圾回收器负担更重。这些 `NamespacedKey` 在每次调用事件处理函数时都**保持不变**，所以我们可以将它们从 `onMobSpawn` 方法中拿出来，作为 `EventHandlers` 的一个属性存储：

```kotlin
// 从 onMobSpawn 中删除以下三行
val heatKey = NamespacedKey.fromString("chunk_heat:heat")!!
val lastOverheatTimeKey = NamespacedKey.fromString("chunk_heat:last_overheat")!!
val sessionIdKey = NamespacedKey.fromString("chunk_heat:session")!!

// 在 EventHandlers 内（onMobSpawn 以外）增加以下三行
private val heatKey = NamespacedKey.fromString("chunk_heat:heat")!!
private val lastOverheatTimeKey = NamespacedKey.fromString("chunk_heat:last_overheat")!!
private val sessionIdKey = NamespacedKey.fromString("chunk_heat:session")!!
```

这种操作叫做**变量提升**，即把每次都创建然后销毁，但其内容几乎不改变的东西，移动到外层来，以重复利用它们。

## 优化查找

我们使用的 `entities` 类型为 `List<String>`，而 `List` 作为列表，在**查找**“是否包含 XXX”这方面的性能是很糟糕的。我们可以把 `entities` 提升到 `EventHandlers` 的属性中，然后将它转换成一个 `Set<String>`（无重复集合），它在查找方面比列表快一些：

```kotlin
// 删除 onMobSpawn 中的这行代码
val entities = config.getStringList("mobs")

// 在 EventHandlers 内（onMobSpawn 以外）增加以下三行
private val entities = config.getStringList("mobs").toSet()
```

Kotlin 提供了扩展函数 `toSet` 来将 `List` 直接转换为一个 `Set`，所以我们只要调用它就好啦。`Set` 接口同样包含 `contains` 方法，功能也完全相同，所以剩余的代码无需任何改动。

---

最终的 `EventHandlers` 类看上去像这样，虽然代码长了一点，但是我们确信在做了这些更改后，代码中的漏洞已经消除，并且性能也会更好：

```kotlin
class EventHandlers(private val config: ConfigurationSection) : Listener {
    private val sessionId = UUID.randomUUID().toString()

    private val heatKey = NamespacedKey.fromString("chunk_heat:heat")!!
    private val lastOverheatTimeKey = NamespacedKey.fromString("chunk_heat:last_overheat")!!
    private val sessionIdKey = NamespacedKey.fromString("chunk_heat:session")!!

    private val entities = config.getStringList("mobs").toSet()

    @EventHandler
    fun onMobSpawn(ev: EntitySpawnEvent) {
        if (!config.getBoolean("enabled")) return
        
        if (!entities.contains(ev.entity.type.key.toString())) return

        val chunk = ev.entity.chunk

        val storedSessionId = chunk.persistentDataContainer.get(sessionIdKey, PersistentDataType.STRING) ?: ""
        if (storedSessionId != sessionId) {
            chunk.persistentDataContainer.remove(heatKey)
            chunk.persistentDataContainer.remove(lastOverheatTimeKey)
        }

        val prevHeat = chunk.persistentDataContainer.get(heatKey, PersistentDataType.INTEGER) ?: 0
        val lastOverheatTime = chunk.persistentDataContainer.get(lastOverheatTimeKey, PersistentDataType.INTEGER) ?: 0

        if (Bukkit.getCurrentTick() < lastOverheatTime + config.getInt("cooldown")) {
            ev.isCancelled = true
            return
        }

        val newHeat = prevHeat + 1
        if (newHeat >= config.getInt("overheat")) {
            chunk.persistentDataContainer.set(
                lastOverheatTimeKey,
                PersistentDataType.INTEGER,
                Bukkit.getCurrentTick()
            )
            chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, 0)
            chunk.persistentDataContainer.set(sessionIdKey, PersistentDataType.STRING, sessionId)
        } else {
            chunk.persistentDataContainer.set(heatKey, PersistentDataType.INTEGER, newHeat)
        }
    }
}
```