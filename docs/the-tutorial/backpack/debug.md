---
sidebar_position: 5
---

# 7-5 调试插件

## 运行和测试

我们的代码看上去天衣无缝，玩家的数据能够保存，打开物品栏时会读取……还能有什么问题吗？只在脑袋里想是永远得不出答案的，**在服务器上测试，是检验插件功能的唯一标准**。

构建插件，Gradle 会自动将 MapDB 的文件包含在插件中，所以我们不需要在 `plugins` 中添加依赖什么的。这次构建可能比之前的时间长很多，因为 Gradle 同时也要打包 MapDB，而它是个相当大的库 —— 最终生成的 `.jar` 文件大约有 16 MiB！好吧，这确实是因为我们的构建脚本（`build.gradle.kts`）写得不是很好，包含了很多不必要的文件，但这个问题，由于篇幅原因，必须放在第二话去解决了。

将插件复制到 `plugins` 文件夹中，然后启动服务器，并通过客户端加入服务器，然后通过 `/backpack` 打开背包：

![Opening Backpack](/img/contents/backpack-1.png)

将随便什么物品塞进去，退出服务器，然后再次加入，物品应该能保持原样：

![Items Kept](/img/contents/backpack-2.png)

现在退出服务器，然后将其重启，再加入服务器，重新打开背包，其中的物品应该仍然保持原样（图上看不出区别，所以就不展示了）。

## 物品复制漏洞

### 时间机器？

到这里你或许觉得就结束了？这个插件已经能正常运行了？也许大多数时候是这样，可如果碰到一些**极端情况**，我们的插件就会出问题。

下面的测试将揭露插件中的第一个漏洞：

1. 向背包中填入一些下界合金块（或者其它东西），退出并重新进入服务器。
2. 加入服务器，并从背包中取出物品。
3. 关闭背包。
4. 在不退出服务器的情况下重启服务器，玩家会被踢出游戏。
5. 重新加入服务器。
6. 打开背包，你会发现**刚才取出的物品重新出现了**！

例如，将 3 组下界合金块放入背包：

![Put Items](/img/contents/backpack-3.png)

重进后取出物品，然后在不退出的情况下重启服务器后：

![Item Duplicated](/img/contents/backpack-4.png)

这是个相当糟糕的 bug，有心之人可以拿它来复制物品，而不明真相的群众则有可能因这个漏洞而丢失物品！如果有个服务器是定时重启的（比如每天凌晨五点），那么只要摸清楚了重启时间去触发这个 bug，就能每天复制最多 9 × 27 × 64 = 15552 个下界合金块，以及 9 个额外的潜影盒！

> Nyaci：这哪是什么 bug 啊，这就是特性！特性！这下再也不会缺下界合金了，桀桀桀……

哈，也许你很了解 bug，但你不知道什么叫做权限（坏笑）：

![Kicked](/img/contents/backpack-5.png)

幸运的是，这个 bug 的原因并不难猜到，而且修复也很容易。

很明显，出于某些原因，**背包数据没有正常保存**，尽管物品被拿出来了，但数据库中的信息没有更新，玩家下次打开背包时，物品就会再次出现，这其实就是一种**回档**。

这一切都是因为我们只在 `PlayerQuitEvent` 中，即**玩家退出服务器时**保存数据，而在服务器关闭时，尽管玩家也会被移出服务器，但 **`PlayerQuitEvent` 不会触发**，插件就“忘记了”保存这些数据！

### 退出时保存数据

为了修复这个问题，我们需要在 `onDisable` 中**将未保存的背包数据存入数据库**。保存数据的代码在 `BackpackListener` 中，为了能在 `Main` 中使用，我们要先在 `BackpackListener` 中增加一个方法：

```kotlin
fun saveBackpacks() {
    backpacks.forEach { (uuid, holder) ->
        bpMap[uuid] = ItemStack.serializeItemsAsBytes(holder.inventory.storageContents)
    }
}
```

`forEach` 对 `backpacks` 中的**每一对**键和值执行后面的 Lambda，我们将它们序列化并存入 `bpMap`，也就是**将 `backpacks` 中未保存的数据写入数据库**。

然后，在 `Main.onDisable` 中调用该方法，为了使用监听器对象，我们同样需要把它**提升为属性**：

```kotlin
class Main : JavaPlugin() {
    private var db: DB? = null
    private var listener: BackpackListener? = null  // 提升为属性

    override fun onEnable() {
        saveDefaultConfig()
        if (config.getBoolean("enabled")) {
            db = DBMaker.fileDB(File(dataFolder, "backpacks.db")).make()
            val bpMap = db!!.hashMap("backpacks", Serializer.UUID, Serializer.BYTE_ARRAY).createOrOpen()

            listener = BackpackListener(config, bpMap)              // 将监听器对象单独作为一个变量
            server.pluginManager.registerEvents(listener!!, this)   // 注册事件
        }
    }

    override fun onDisable() {
        listener?.saveBackpacks()   // 退出时保存剩余数据
        db?.close()
    }
}
```

这样的代码显得有些杂乱，也许我们有更好的设计方式，可以不需要加上那些 `!!`、`var` 或者 `?`，但是现在，我们的心思全放在修复 bug 上，让我们先装作没看到这个问题吧（笑）。

重新构建和安装插件，重启并加入服务器，再测试一次上面的步骤，这次漏洞就应该被修复了，坏人想要复制下界合金块的想法也就被我们粉碎了，哈哈！

## 物品溢出错误

### 怎么想都放不下吧！

修复了一个漏洞固然可喜可贺，但要是能把另一个也修复了则更佳。第二个漏洞（应该说是**错误**）相比第一个漏洞要更加严重，因为它会导致命令执行失败，下面的步骤将揭露它：

1. 关闭服务器，将配置文件中 `size` 的值设置为 `54`。
2. 启动服务器，向背包中放入 54 组下界合金块（或者其它什么东西）。
3. 关闭服务器，数据正常保存。
4. 将配置文件中 `size` 的值改回 `9`。
5. 启动服务器，并执行 `/backpack`，**背包将无法打开，并且控制台会报错**。

例如，修改配置后，在背包里填入 54 组钻石：

![Put Items](/img/contents/backpack-6.png)

将配置改回 `9` 后，执行命令：

![Error](/img/contents/backpack-7.png)

并且服务器控制台会输出以下内容（省略了很多行）：

```log
[23:16:28 ERROR]: Command exception: /backpack
org.bukkit.command.CommandException: Unhandled exception executing command 'backpack' in plugin Backpack v1.0
        at org.bukkit.command.PluginCommand.execute(PluginCommand.java:47) ~[paper-api-1.21.4-R0.1-SNAPSHOT.jar:?]
        ...
Caused by: java.lang.IllegalArgumentException: Invalid inventory size (54); expected 9 or less
        at com.google.common.base.Preconditions.checkArgument(Preconditions.java:302) ~[guava-33.3.1-jre.jar:?]
        ...
```

这个 bug 的原因，虽然有些违背直觉，但是报错信息已经说明了问题：**物品栏的格子太少**。数据库中存储的物品栏有 54 个物品，而将配置修改为 9 个后，Bukkit 会认为“54 个物品无法塞入 9 个格子里”，于是就抛出错误。

会出现这种问题，说明我们在**恢复数据**那里的代码还是有些偷工减料：

```kotlin
if (dat != null) {
    // 可能会放不下
    holder.inventory.storageContents = ItemStack.deserializeItemsFromBytes(dat)
}
```

要进行这样的赋值，需要左边物品栏的格子数足够多，能够放下右边的全部物品。然而，如果配置文件发生修改，这个条件就会被破坏。

### 丢弃多余物品

我们可以对右边的值做一点小小的修改：

```kotlin
holder.inventory.storageContents = 
    ItemStack.deserializeItemsFromBytes(dat)
        .take(size).toTypedArray()  // 只取出前面 size 个物品
```

*上面的代码写成一行会更好看，这里分行是为了展示 `take` 的使用。*

`take` 做的事情是**切割**，从恢复的物品信息数组中**取出前 `size` 个物品**。`toTypedArray` 将 `take` 的结果转换为 `storageContents` 所需要的类型。

也就是说，如果管理员修改了背包大小，那么我们只好丢弃掉玩家背包中多出来的部分了。你可能会觉得“这什么嘛，那我缺的钻石这块谁给我补啊”，的确，这种做法不是最完美的，我们可以尝试将多余的物品塞入玩家的物品栏，或者让它们掉在地上 —— 但我们目前的知识还不足以做到这一点，所以暂时只能采取这个暴力但有效的方法填补漏洞。

重新构建并安装插件，现在再试试，当背包容量减少后，剩余的部分就会被丢弃了：

![Removed Items](/img/contents/backpack-8.png)

这样我们就修复了插件中的所有漏洞，可喜可贺！

<details>
<summary>你是职业选手吗？</summary>

事实上这个插件中还存在一些问题，例如当打不开数据库时，我们没有进行任何处理（应当显示相关的错误信息），我们也没有提供进行数据清理的方法，而且将序列化和写入数据库全放在游戏线程上也会影响性能，这些问题将在更高级的后续章节解决。

</details>

---

这次的运行测试和以往都不一样，以前，测试只是走个形式，只要编译能成功，插件几乎总是能运行。这次我们**在测试中发现了漏洞**，进而找出代码中考虑不周到的地方，并加以修复，其实才是大多数插件开发的正常流程。虽然这么说，但测试其实并不容易，在一般情况下发生的问题很快就能发现，但对于一些极端情况，有时要找出 bug 会非常困难。本书的后续章节中有关于调试插件的专门部分，届时我们将讲解一些测试插件的方法。

回到本章的主要内容 —— 数据库上来，这是我们第一次离开 Bukkit 温暖的怀抱，作为一个普通 Kotlin 程序，创建并维护着自己的数据库，来看看我们都做了什么：

- 根据数据存储需求，选用合适的数据库。
- 在 Gradle 中添加依赖库。
- 创建并妥善关闭数据库。
- 物品栏数据与 `ByteArray` 的相互转换。
- 选择合适的时机，将物品栏数据存入数据库。
- 灵活地选择合适的位置处理命令。
- 修复数据保存与物品恢复中的漏洞。

使用数据库存储数据几乎是规模稍大点的插件必备的技能了！这次我们使用的 MapDB 非常简单，但在数据量增大时，我们会需要一些更强大但也更复杂的数据库系统。为了不至于在那时被弄得手忙脚乱，最好将这个项目的代码弄个明白，如果需要，可以在 GitHub 上找到 [源代码](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/backpack)。