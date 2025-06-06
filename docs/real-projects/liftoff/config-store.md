---
sidebar_position: 3
---

# LT-3 读写配置文件（上）

## 如果我倒着走呢？

前一节已经提到，物品信息用配置文件来存储是非常方便的，不过，配置文件不能用来存储大量的数据。先前在旅行背包插件中，我们正是出于这样的考量而选择使用单独的数据库。

在这个插件里，情况则有所不同，由于初始套装的内容只有一份，占据的存储空间较小，而配置文件用来存储物品信息又是如此方便，那我们不妨就来试试吧！

*除此之外还有另一个原因，即初始套装算是一种“配置”，是由管理员设置好的东西，而玩家背包数据则不是，请体会这两者之间的差别。*


先前我们一直在使用 `config.yml`，从其中读取用户的配置：

```kotlin
config.getInt("some-number", 0) // 可能是 42
```

并且我们也能通过 `set` 方法，为某个键设置值：

```kotlin
config.set("some-number", 99)
```

不过像这样对配置文件的修改，仅仅是修改了 `config` 对象，其中的内容并不会被自动写入 `config.yml` 中，也就是说，这样的修改会在服务器重启之后丢失。

要怎么样**保存配置文件的修改**呢？其实这非常简单，Bukkit 已经为我们提供了相应的方法：

```kotlin
/**
 * 保存插件的配置文件内容，将其写入 `config.yml` 中。
 */
fun Plugin.saveConfig()
```

和 MapDB 的使用类似，数据的保存可以在 `onDisable` 中进行，所以只要在 `onDisable` 中调用 `saveConfig` 就能把对 `config` 进行的修改存入文件中。

:::note 在过去

以前，向配置文件中保存些数据是一件麻烦的工作，因为那时的 Bukkit 使用的 YAML 解析器非常原始，尽管它们能正常保存键和值的数据，但是 YAML 中的**注释会丢失**。注释虽然对我们的程序无关紧要，但是对于用户来说却是非常重要的参考。因此，那时我们必须自己想办法保存和恢复这些注释，或者干脆使用另一个文件。

幸运的是，现代的服务端已经升级了 YAML 模块，即使修改了文件中的内容，其中的注释也能够保留。

:::

## 读取物品配置……？

我们将使用配置文件中的 `kit-content` 键来保存初始套装所包含的物品。

> Nyaci：项目中不是没有 `config.yml` 吗？怎么还能使用这个键呢？

在先前，我们对于配置文件的使用，仅限于**默认配置文件**（即项目中的 `config.yml`）当中的内容，但大家要知道，配置文件中理论上可以存有任何键 —— 即使它一开始并不存在于默认配置文件中，我们也可以在插件运行时进行添加。

在 `onEnable` 中添加如下内容：

```kotlin
val kitItems = config.getList("kit-content", emptyList<ItemStack>())!! as List<ItemStack>
```

`getList` 方法读取 `kit-content` 键的值，并尝试将其转换为一个 `List` 返回。与其它所有 `get` 系列的方法类似，它的第二个参数允许我们指定默认值，在这里我们使用 `emptyList<ItemStack>()` 表示“空列表”，也就是说，如果 `kit-content` 不存在（比如插件第一次运行时），就返回一个空白的 `List`。

> Nyaci：其实我从第一话就想问了，这个 `<>` 到底是什么东西呢？

好吧，看来是不能再继续糊弄下去了（笑），这是**类型参数（Type Parameter）**，是 Kotlin **泛型（Generics）** 的一部分，而后者是几乎所有现代编程语言当中的又一个重要概念，也许是时候来介绍一下它了，同时最好也把先前一直略过的 `List` 之类的说明一下……