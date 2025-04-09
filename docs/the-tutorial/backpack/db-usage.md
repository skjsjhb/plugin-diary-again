---
sidebar_position: 3
---

# 7-3 创建、使用和关闭数据库

## 创建数据库

### 使用文件

要在我们的插件中使用数据库，我们需要先**创建数据库对象**（还记得吗，在 Kotlin 中一切都是对象），这需要在 `onEnable` 中完成：

```kotlin
if (config.getBoolean("enabled")) {     // 仅当启用插件时才创建数据库
    val db = DBMaker.fileDB(File(dataFolder, "backpacks.db")).make()
}
```

我们首先构造一个 `File` 对象，`File` 是 Java 标准库的一部分，用来表示一个文件，它的构造函数用法如下：

```kotlin
/**
 * 构造一个文件对象，表示 `parent` 目录中名为 `name` 的文件。
 */
class File(parent: File, name: String)
```

`dataFolder` 是 `JavaPlugin` 的一个属性，类型为 `File`，表示**插件数据所在的目录**，插件的配置和其它数据都在这里存放。先前我们在这里存储过 `config.yml`，不过是通过 `saveDefaultConfig` 做了这件事，而现在轮到我们来亲自访问这个目录了。

我们使用 `backpacks.db` 作为文件名，数据库的名称可以任意（笔者在这里本来是想使用 `data.ciallo` 的，不过为了~~显得专业~~让文件的含义更清晰，还是使用了更为正式的名称）。

:::info 无旗之下

文件的扩展名仅是一种形式上的**约定**，与文件的实际类型并无必然的联系 —— 它们只是提示该文件“可能”是什么类型。一个后缀为 `.exe` 的文件也完全可以包含 Kotlin 源代码，MP3 音频或者一张图片。

:::

### 构造数据库对象

把 `dataFolder` 和数据库名通过 `File` 结合起来，就得到数据库文件对象，然后我们就可以使用 MapDB 的 `fileDB` 方法**创建**数据库对象：

```kotlin
/**
 * 使用指定的文件存储数据库内容。
 * 返回的对象是一个构造器，稍后可以通过其 `make` 方法构造所需的数据库。
 */
fun fileDB(f: File): DBMaker.Maker
```

`fileDB` 返回一个使用指定文件的数据库构造器，构造器的功能和构造函数差不多，它们能用来构造另一个类的对象。我们随后调用它的 `make` 方法**创建数据库对象**。

顺便一提，你可以在 [MapDB 的官方网站](https://mapdb.org/dokka/latest/mapdb/org.mapdb/) 上找到它的文档。MapDB 是用 Kotlin 编写的，所以文档使用的也是 Kotlin 的语法。

## 关闭数据库

数据库创建好了固然令人兴奋，但这并不是使用数据库的全部。我们需要在服务器关闭时**保存数据**，MapDB 将数据的保存合并在关闭数据库的操作中了，也就是说，我们需要**在服务器关闭时关闭数据库**。如果不这么做，数据库中的内容就会丢失。

像 `onEnable` 一样，Bukkit 为 `JavaPlugin` 提供了 `onDisable` 方法，允许插件在**停用**时执行一些操作，我们打算在这里保存数据，所以在 `Main` 中添加如下代码：

```kotlin
override fun onDisable() {
    // 要做之事
}
```

为了关闭数据库，我们需要使用先前创建的 `db` 对象，但是它只在 `onEnable` 中可用。为了能在 `onDisable` 中使用它，我们需要将 `db` 变量**提升为属性**：

```kotlin
class Main : JavaPlugin() {
    private var db: DB? = null  // 此时无法决定 db 的内容，因为可能不会创建数据库

    override fun onEnable() {
        saveDefaultConfig()
        if (config.getBoolean("enabled")) {
            // 如果创建了数据库，就将 db 更改为数据库对象
            db = DBMaker.fileDB(File(dataFolder, "backpacks.db")).make()
        }
    }

    override fun onDisable() {
        // 如果 db 不是 null，就调用 close 方法
        db?.close()
    }
}
```

由于我们**有可能不会创建数据库**，所以不必过早地初始化 `db`，我们可以让其初始为 `null`。当数据库被创建后，我们再将 `db` 的值**修改为数据库对象**，从而能在 `onDisable` 中再次找到并关闭它。为了能修改这个属性，需要使用 `var` 而不是 `val`。

`db?.close()` 通过 `?.` 运算符，在 `db` 不是 `null` 的时候调用 `close` 方法，**将数据库内容写入文件**。

:::warning 

插件运行中任何没有保存的数据都会**在服务器重启后丢失**，包括所有的变量值、已创建的对象等。

存储在 PDC 中的数据，以及对世界的修改，都由 Bukkit 负责保存，而像集成式数据库这种由插件自行维护的系统，必须手动保存。

:::

## 存取数据

### 创建数据表

创建数据库后，我们就可以在数据库中**创建一张映射表**：

```kotlin
val bpMap = db!!.hashMap("backpacks", Serializer.UUID, Serializer.BYTE_ARRAY).createOrOpen()
```

`hashMap` 负责映射表的创建，它接受三个参数，分别是表名、键类型和值类型。

`createOrOpen` 告诉 MapDB 读取这张表的内容，如果不存在就创建一个。这样，如果先前我们在这张表中存储了数据，就可以继续使用它们。

我们计划用 UUID 存储玩家，而将物品栏信息**序列化**为 `ByteArray`，即字节数组。之所以选用 `ByteArray` 这个类型，是因为 Bukkit 刚好提供了**将物品栏转换为 `ByteArray` 的方法**，我们稍后会介绍。

:::note

为什么要进行序列化而不是直接使用 `Inventory` 呢？因为数据库在组织管理数据时，对于数据类型有一定的要求。我们需要将物品信息**转换为数据库可以处理的格式**（`ByteArray` 和 `UUID` 都是 MapDB 支持的格式）。

事实上，MapDB 可以处理任意类型的数据，但由于它不知道物品信息的具体格式，把物品信息“硬塞”进 MapDB 里就会很慢，而且还不可靠。Bukkit 更了解物品信息的结构，所以由它将数据**转换**成 `ByteArray`，再由 MapDB 去**存储**，才是最佳组合。

:::

:::tip 术语库

**序列化（Serialization）** 就是将对象转换成**字节序列**的过程，通常用来存储数据，这些数据稍后会被**反序列化（Deserialization）** 以获取原始的对象。

最简单的序列化方法就是把对象对应的内存复制下来，但这么做不怎么靠谱。Bukkit 提供了单独的方法对物品栏数据进行序列化。

:::

### 读写键值

用这种方法创建的 `bpMap` 实现了 `MutableMap` 接口，键的类型为 `UUID`、值的类型为 `ByteArray`。既然如此，我们可以像之前一样**使用 `[]` 来读写数据**，只需要提供键和值：

```kotlin
bpMap[player.uniqueId] = ...          // 设置值
println(bpMap[player.uniqueId])       // 读取值
bpMap.containsKey(player.uniqueId)    // 查询键是否存在
```

看吧，我们完全不需要使用复杂的函数，也不需要学习一门新语言，只需要使用熟悉的方法，而且 MapDB 还会把我们的修改自动存入数据库，这真是太棒了！
