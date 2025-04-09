---
sidebar_position: 4
---

# 7-4 处理事件和命令

## 使用物品栏

### 初始代码

和上一章一样，我们把事件处理程序放在一个单独的文件中：

```kotlin
class BackpackListener(
    config: ConfigurationSection,                   // 配置内容
    private val bpMap: MutableMap<UUID, ByteArray>  // 在数据库中打开的表
) : Listener {
    // 要做之事
}
```

由于我们要读写数据库，也要访问配置文件，所以传递的属性增加到了两个。`config` 仍然是普通构造函数参数，因为我们只在获取背包相关的信息时访问它一次，而 `bpMap` 会在监听器的各处被读写，所以作为属性传递。

现在我们可以把配置文件的内容提取出来：

```kotlin
private val size = config.getInt("size", 9)
private val title = config.getString("title", "旅行背包")!!
```

我们同时也在 `Main` 中注册事件处理函数：

```kotlin
server.pluginManager.registerEvents(BackpackListener(config, bpMap), this)
```

### 物品栏对象

回想一下我们在菜单插件中做过的事情，为了显示物品栏，需要创建一个类实现 `InventoryHolder`，我们如法炮制：

```kotlin
private class BackpackInventoryHolder(size: Int, title: String) : InventoryHolder {
    private val inv = Bukkit.createInventory(this, size, Component.text(title))

    override fun getInventory() = inv
}
```

物品栏的大小和标题作为构造函数参数，稍后在创建物品栏时再提供。

我们将 `BackpackInventoryHolder` 设置为 `private`，这样只有 `BackpackListener.kt` 文件中的代码才能访问它，可以避免这个类被意外地用在不该用的地方。

### 将玩家与物品栏关联

在菜单插件中，玩家每次输入命令，我们都创建一个新的物品栏，而这次为了让玩家每次打开背包都访问**同一个**物品栏，我们需要**记忆玩家与物品栏的对应关系**。该怎么做？你应该知道的 ——

```kotlin
// 在 BackpackListener 中增加映射表
// 记录玩家 UUID 与背包物品栏的对应关系
private val backpacks = HashMap<UUID, BackpackInventoryHolder>()
```

我们可以通过查询 `backpacks` 来获得玩家当前的物品栏。不过，这里的物品栏会在服务器重启后丢失，别担心，我们马上就会解决这个问题。

注意，到目前为止我们还完全**没有使用 `bpMap` 来存储数据**，无论是物品栏的创建还是与玩家的对应，都是在内存中进行的。

## 保存物品栏数据

我们计划在玩家**离开服务器**时，将其物品栏的内容保存到数据库中，并从内存中删除物品栏。玩家退出服务器对应的事件是 `PlayerQuitEvent`，因此我们添加一个方法作为事件处理函数：

```kotlin
@EventHandler
fun onPlayerLeave(ev: PlayerQuitEvent) {
    // ...
}
```

我们首先在 `backpacks` 中查找该玩家对应的背包物品栏：

```kotlin
val holder = backpacks[ev.player.uniqueId] ?: return
```

这个物品栏可能不存在（例如玩家从没打开过背包），如果是这样，那也不需要保存什么数据了，我们就离开函数。

接下来，我们使用 Bukkit 提供的方法，**将物品栏的内容序列化**，转换成 `ByteArray`，并存入 `bpMap`：

```kotlin
bpMap[ev.player.uniqueId] = ItemStack.serializeItemsAsBytes(holder.inventory.storageContents)
```

```kotlin
/**
 * 将指定的物品数组转换为字节序列。
 */ 
fun serializeItemsAsBytes(items: Array<ItemStack>): ByteArray
```

`Inventory` 的 `storageContents` 属性是一个数组，类型为 `Array<ItemStack>`，包含该物品栏中**全部物品**的信息，它刚好可以用作 `serializeItemsAsBytes` 的参数，所以把它们组合起来，就能将物品栏数据转换成 `ByteArray` 了。

一旦得到了序列化的 `ByteArray`，我们就以玩家的 UUID 为键，将数据存入 `bpMap`，这和我们在上一章中写入映射表使用的语法完全一样。

物品栏数据存储完成后，我们就可以将内存中的物品栏删除，腾出些空间来：

```kotlin
backpacks.remove(ev.player.uniqueId)
```

在从 `backpacks` 中删除了玩家的 UUID 后，Kotlin 就会发现对应的物品栏没有人再需要了，就会自动将它删除。

## 加载和显示物品栏

### 注册和处理命令

当玩家首次打开背包时，我们要在 `backpacks` 中创建对应的物品栏，同时，如果 `bpMap` 中存储着玩家的背包数据，那么我们要将它**恢复**到新创建的物品栏中。

打开背包是通过命令 `/backpack` 进行的，所以我们要先向 `plugin.yml` 中添加内容：

```yaml
commands:
  backpack:
    aliases:
      - bp
    usage: /backpack
    description: Opens backpack.
```

这里多了一个新的键：`aliases`，它是一个列表，代表命令可供选用的**别名**。`backpack` 是命令的正式名称，不过我们可以在 `aliases` 中添加一些别名，以方便用户使用。例如，在很多聊天插件中，`/w` 就是 `/tell`（发送私聊消息）的别名。

我们在 `BackpackListener` 的**构造函数**中注册命令，这是因为 `backpacks` 和其它要用到的变量都定义在那里，所以在这里处理命令最方便。也就是说，`BackpackListener` 现在除了承担事件监听的职责，也负责处理命令。

```kotlin
init {
    Bukkit.getPluginCommand("backpack")?.setExecutor { sender, command, label, args ->
        if (sender is Player) {
            // 处理命令
        }
        
        true    // 总是返回 true，告知 Bukkit 命令成功
    }
}
```

这里我们使用 `Bukkit.getPluginCommand` 替代了先前的 `server.getPluginCommand`，`Bukkit` 对象包含了 `server` 的所有方法，允许我们在任何地方使用服务器的功能，而**不需要传递 `server` 对象**。两个版本的方法是相同的，所以后面添加的 Lambda 也完全一样。

我们同时也判断 `sender` 是不是 `Player`。由于 Lambda 中不能使用 `return`（事实上可以，但不是那么容易），因此我们需要把命令的主要代码放在 `if` 的 `{}` 中。

### 获取或创建物品栏

以下是获取玩家背包物品栏的代码：

```kotlin
val inv = backpacks.computeIfAbsent(sender.uniqueId) {
    // 创建物品栏
}
```

`computeIfAbsent`，顾名思义，在映射表中不存在某个值时，它会创建一个：

```kotlin
/**
 * 在映射表中查找 `key` 对应的值，并将其返回。
 * 如果对应的值不存在，则调用 `factory` 函数生成一个值，将其插入映射表，并返回该值。
 */
fun computeIfAbsent(key: K, factory: (K) -> V): V
```

### 查找已存储的数据

如果 `backpacks` 中已经有玩家的物品栏了，`computeIfAbsent` 会返回该物品栏，而如果没有，那么 `{}` 中的内容会被执行，我们要在这里**创建**一个物品栏，并**恢复**存储的数据：

```kotlin
val inv = backpacks.computeIfAbsent(sender.uniqueId) {
    // 一并创建所有者和物品栏
    val holder = BackpackInventoryHolder(size, title)

    // 获得已存储的数据
    val dat = bpMap[sender.uniqueId]

    // 如果数据存在，则向物品栏中填入内容
    if (dat != null) {
        holder.inventory.storageContents = ItemStack.deserializeItemsFromBytes(dat)
    }

    // 返回值，将被插入到 backpacks 中
    holder
}
```

和菜单插件中创建物品栏差不多，我们直接使用构造函数 `BackpackInventoryHolder` 创建物品栏的所有者，并将其返回（还记得吗，Lambda 的返回值是其最后一个表达式的值）。唯一的新东西是中间的几行：

```kotlin
val dat = bpMap[sender.uniqueId]

if (dat != null) {
    holder.inventory.storageContents = ItemStack.deserializeItemsFromBytes(dat)
}
```

`bpMap[sender.uniqueId]` 在数据库中查找玩家的背包物品信息，如果不存在则返回 `null`。在读到数据后，我们判断它是否是 `null`，如果不是，说明玩家有保存的物品栏，接下来就要将它**恢复**。

### 恢复物品信息

当拿到已存储的数据后，我们就使用 `deserializeItemsFromBytes`，**将存储的 `ByteArray` 反序列化，转换回物品信息**，并赋给 `storageContents`：

```kotlin
holder.inventory.storageContents = ItemStack.deserializeItemsFromBytes(dat)
```

```kotlin
/**
 * 反序列化指定的 `dat` 包含的字节序列，重新构造物品信息。
 */ 
fun deserializeItemsFromBytes(dat: ByteArray): Array<ItemStack>
```

这基本上就是把保存数据的过程倒过来 —— 向 `storageContents` 属性赋值，也就是用恢复出来的物品信息**覆盖物品栏中的内容**，这样我们就完成了玩家物品数据的恢复。

:::info

如果物品数据已经恢复到游戏中了，为什么在这时不将存储的数据删除呢？这是因为内存是**易失的**，如果服务器崩溃而未能保存数据，而我们又从数据库中删除了存储的数据，那么玩家的背包就会全部丢失！相反，如果数据库中还保留着上一次存储的数据，那么玩家的背包状态还可以恢复到最近一次保存时的情况。

先前我们从内存中删除物品栏，是因为我们认为文件是比内存可靠的，而玩家离开服务器后，物品栏信息就没有用了。因此，一旦数据存储完成，内存中的物品栏就不再需要了，将物品栏删除可以腾出一些宝贵的内存空间。

:::

### 显示物品栏

在命令处理程序的最后，我们将物品栏显示给玩家：

```kotlin
sender.openInventory(inv.inventory)
```

这样命令处理程序就完成了。

## 完整代码

最终的 `BackpackListener.kt` 看上去像这样：

```kotlin
private class BackpackInventoryHolder(size: Int, title: String) : InventoryHolder {
    private val inv = Bukkit.createInventory(this, size, Component.text(title))

    override fun getInventory() = inv
}

class BackpackListener(
    config: ConfigurationSection,
    private val bpMap: MutableMap<UUID, ByteArray>
) : Listener {
    private val backpacks = HashMap<UUID, BackpackInventoryHolder>()
    private val size = config.getInt("size", 9)
    private val title = config.getString("title", "旅行背包")!!

    init {
        Bukkit.getPluginCommand("backpack")?.setExecutor { sender, command, label, args ->
            if (sender is Player) {
                val inv = backpacks.computeIfAbsent(sender.uniqueId) {
                    val holder = BackpackInventoryHolder(size, title)

                    val dat = bpMap[sender.uniqueId]

                    if (dat != null) {
                        holder.inventory.storageContents = ItemStack.deserializeItemsFromBytes(dat)
                    }

                    holder
                }

                sender.openInventory(inv.inventory)
            }
            true
        }
    }

    @EventHandler
    fun onPlayerLeave(ev: PlayerQuitEvent) {
        val holder = backpacks[ev.player.uniqueId] ?: return
        bpMap[ev.player.uniqueId] = ItemStack.serializeItemsAsBytes(holder.inventory.storageContents)
        backpacks.remove(ev.player.uniqueId)
    }
}
```

`Main.kt` 的内容则是：

```kotlin
class Main : JavaPlugin() {
    private var db: DB? = null

    override fun onEnable() {
        saveDefaultConfig()
        if (config.getBoolean("enabled")) {
            db = DBMaker.fileDB(File(dataFolder, "backpacks.db")).make()
            val bpMap = db!!.hashMap("backpacks", Serializer.UUID, Serializer.BYTE_ARRAY).createOrOpen()

            server.pluginManager.registerEvents(BackpackListener(config, bpMap), this)
        }
    }

    override fun onDisable() {
        db?.close()
    }
}
```

---

这一节的代码有些长，不过大多数都是你已经了解过的东西，就当是复习了一遍啦。虽说我们引入了新的数据库存取，但其实也不过就是在操作 `MutableMap`，唯一的不同是将物品信息和 `ByteArray` 相互转换，不过即使是这项“看上去很麻烦”的工作，也由 Bukkit 为我们完成了。所以，总的来说，我们所做的事情，基本上就是在**把这些不同的功能连接到一起** —— 这也正是大多数插件的主要任务。