---
sidebar_position: 5
---

# 2-3 监听和处理事件

## 添加事件处理器

下面我们来为“玩家加入服务器”这个事件**设置事件处理器**，这样我们就能在玩家加入服务器时执行一些代码。

由于一个插件可能用到相当多的事件，Bukkit 在接受我们注册事件时提供了这样的一种方式：我们的插件需要向 Bukkit **提供一个特殊的“监听器”对象**，这个对象的**方法**将被 Bukkit 认为是事件处理函数。

要自己摸索出来如何构造这个对象可有点困难，所以笔者在这里直接为大家写好了代码。在 `Main.kt` 的最下方添加以下内容，并使用 IDEA 的自动补全来导入需要的内容：

```kotlin
// 监听器对象
object EventHandlers : Listener {

    // onPlayerJoin 就是一个事件处理函数
    @EventHandler
    fun onPlayerJoin(ev: PlayerJoinEvent) {
        // 要做之事
    }
}
```

:::warning 同名不同姓

由于 `Listener` 这个名字太过于常见了，因此 IDEA 在导入时可能会提供很多建议：

![Multiple Imports](/img/contents/multi-import.png)

确保你导入的是 `org.bukkit.event` 包下的 `Listener`，否则插件将无法正常运作。你可以查看文件开头添加的 `import` 行来确认这一点。

:::

这里我们用 `object EventHandlers` 创建了一个对象，对象的名字并没有什么特殊的含义，可以随意设计，只要不和已有的名字冲突就行。我们让 `EventHandlers` “复制”了 `Listener` 中的内容，也就是**把处理事件的模板代码复制给了我们的事件处理器**，就像前面的 `Main : JavaPlugin` 一样，不过要注意这里 `Listener` 后面没有 `()`。

随后我们在这个对象中**添加方法**，并且在上方**添加 `@EventHandler` 注解**。你可以将注解理解为一种标记，Bukkit 通过识别 `@EventHandler` 注解来查找事件处理函数。一旦它找到，就按以下规则**设置事件监听关系**：

- 要监听的事件是该方法**第一个参数的类型所指定的事件**。这里我们使用 `PlayerJoinEvent` 来监听“玩家加入服务器”的事件。具体这些事件的名称从何而来，要怎么使用，我们稍后再提及。
- 一旦对应的事件发生，Bukkit 就**执行这个方法**，并将事件的相关信息整合成一个对象，**作为第一个参数传递**。

:::note

方法名和参数名不会影响 Bukkit 对事件处理函数的注册和执行，它们仅仅是方便你理解这个事件处理函数的作用。

:::

所以总的来说，要添加一个事件处理函数，就是做以下几件事情：

- 创建一个对象并“复制” `Listener`，或者使用一个已有的对象。
- 在其中**添加一个方法**，这个方法只有一个参数，类型是**要监听的事件类型**。
- 在方法上**增加一个 `@EventHandler` 注解**。
- 把要做的事情写在该方法中。

现在我们设计好了监听器对象，是时候让 Bukkit 知道它的存在了，也就是所谓的**注册监听器**。一般而言，注册事件是在插件启用时进行的，所以我们向 `Main` 类的 `onEnable` 方法中添加以下内容：

```kotlin
server.pluginManager.registerEvents(EventHandlers, this)
```

`server` 是 `JavaPlugin` 的一个属性，这个属性指向 Bukkit 服务器本身，由于被我们“复制”到 `Main` 中了，所以我们也可以使用它。随后，我们通过服务器对象的 `pluginManager` 属性（顾名思义，管理插件的各种功能）下的 `registerEvents` 方法，将先前创建的 `EventHandlers` 对象交给 Bukkit。

`registerEvents` 接受两个参数，第一个是监听器对象，第二个则是插件自身。Kotlin 中的 `this` 关键字用来指代“当前对象”，在这里也就是我们的插件。

## 编写事件处理函数

现在回到 `onPlayerJoin` 方法中来，我们知道 Bukkit 会在玩家加入服务器时调用这个方法，所以我们需要在这个方法中编写“向所有玩家广播消息”的功能，这又分为以下两步：

- 获取加入服务器的玩家名称，并构造一条消息。
- 将这条消息在服务器中广播。

当然，各位读者对于 Bukkit 的 API 肯定还几乎一无所知，所以笔者仍然把代码写好放在这里：

```kotlin
val name = ev.player.name
val msg = Component.text("Welcome $name to our server!")
ev.player.server.broadcast(msg)
```

:::note 可变和不变

这里的 `val` 和 `var` 很像，同样也是定义变量，不过由 `val` 定义的变量**在创建后不可以再修改**，这是为了防止不小心修改了不应该修改的东西。通常在定义变量时都使用 `val`，只有在确实需要修改变量时才使用 `var`。

:::

前面提到过，Bukkit 会将事件相关的信息全都放在传递给我们的对象中。`PlayerJoinEvent` 对象的 `player` 属性包含了加入服务器的玩家信息，而其下的 `name` 属性则包含了玩家名，第一行所做的事情就是获取这一信息。

随后我们**构造欢迎消息**，首先是使用**插值**语法构造一个字符串：`"Welcome $name to our server!"`，这里 `$name` 代表“把 `name` 变量的内容插入到这里”，所以如果 `name` 的值是 `skjsjhb`，那么这个字符串就会被组合成 `Welcome skjsjhb to our server!`，这比用 `+` 拼接字符串要方便很多。

接着我们使用 `Component.text` 把这个字符串**转换为一个消息组件**。关于 Component API 我们会在后续的章节中介绍，大家就先把它理解为“Bukkit 中传递消息的一种格式”就好。和前面的 `Listener` 类似，这里的 `Component` 应该来自 `net.kyori.adventure.text`，而不是其它的包。如果你导入了错误的名称，IDEA 会在 `.text` 方法下方划一条红线，代表“没有这个方法”。

最后，我们通过 `ev.player.server` 获取玩家所在的服务器对象，和 `Main` 中的 `server` 属性差不多，不过这里要通过玩家的信息来获取。服务器对象中已经包括了用于广播消息的方法 `broadcast`，我们将先前构造好的消息组件传递给它，一切就 OK 了！

完成后的 `Main.kt` 看上去像这样：

```kotlin
import net.kyori.adventure.text.Component
import org.bukkit.event.EventHandler
import org.bukkit.event.Listener
import org.bukkit.event.player.PlayerJoinEvent
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        println("This is the Welcome Broadcast plugin.")
        server.pluginManager.registerEvents(EventHandlers, this)
    }
}

object EventHandlers : Listener {
    @EventHandler
    fun onPlayerJoin(ev: PlayerJoinEvent) {
        val msg = Component.text("Welcome ${ev.player.name} to our server!")
        ev.player.server.broadcast(msg)
    }
}
```

我们把代码稍微修剪了一下，将 `ev.player.name` 直接嵌入到字符串中，免去了定义**中间变量（Intermediate Variables）** `name` 的过程。由于嵌入的字符串中含有 `.`，因此需要在两侧加上 `{}`，不然 Kotlin 就会理解成“把 `ev` 拼上字符串 `".player.name"`”，那就乱套了！

:::note

通常，像 `ev.player.name` 这样简单的属性访问，一般不单独定义一个变量存储结果，而是将其直接嵌入到使用它的代码中，这个过程叫做**变量内联（Variable Inline）**，这能让代码简洁一些。

:::