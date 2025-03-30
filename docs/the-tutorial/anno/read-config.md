---
sidebar_position: 7
---

# 3-4 使用配置文件（续）

## 获取配置文件内容

欢迎回来！希望你还没有被关于 Kotlin 面向对象的知识吓跑（笑）。

现在我们已经知道，`getConfig()` 方法，也就是在 Kotlin 中对应的 `config` 属性，能用来获取配置文件对象。这个属性的类型是 `FileConfiguration`，可以通过它来**操作配置文件的内容**，不仅可以读，还可以写。

为了防止你忘掉了我们的配置文件 `config.yaml`，让我们把它拿出来再看看：

```yaml
enabled: true
content: Welcome to my Paper server!
```

要获取配置文件中某个键的内容，该使用什么方法？如果直接在 Javadoc 中的“Method Summary”中查找，你或许找不到相关的内容，这是因为 Javadoc 只会显示当前类所拥有的方法，而**不会显示它继承到的方法**。要查找继承来的方法，需要向下翻，在一系列“Methods inherited from ...”中寻找对应的方法。

![Inherited Methods](/img/contents/jd-inherit.png)

诶，为什么我不需要查阅 Javadoc 就知道该怎么做？这就是经验派上用场的时候了（笑），像 Bukkit 这种大型的 Java 程序，其命名都非常规范，“获取”在英文中对应的词是 get，那么很有可能对应的方法就叫 `get`、`getKey`、`getValue` 或者什么类似的东西，在 IDEA 中试试就知道了。言归正传，下面我们介绍两种读取配置文件的方式。

### 读取键内容（暴力地）

下面是获取 `enabled` 键的代码：

```kotlin
val isEnabled = config.get("enabled")
```

相应的方法是 `get`，它的 Java 定义是（没办法，Paper 是 Java 写的）：

```java
/**
 * 获取由 `path` 指定的键所对应的内容。
 * 尝试根据其值，将其转换为合适的数据类型。
 * 如果该键不存在，则返回 `null`。
 */
public Object get(String path)
```

Kotlin 版本是（省略了注释）：

```kotlin
fun get(path: String): Any?
```

:::note 从 Java 到 Kotlin

尽管你并不需要会写 Java 代码（本书所有代码都会使用 Kotlin 完成），但能阅读像上面那样的 **Java 方法签名**是很重要的。Java 和 Kotlin 在函数定义的语法上很相似，只不过 Java 的各种类型都排在前面。另外，在上面的例子里，Java 类型 `Object` 在 Kotlin 中对应 `Any?`。

请仔细观察这两个方法之间的转换关系，最好是记住这种规则。这样以后当你碰到 Java 风格的函数时，就知道它的 Kotlin 版本长什么样。这是必要的，因为 Javadoc 中提供的签名都是 Java 风格。

:::

`path` 指的是某个键的 **YAML 路径**，键的路径是**其所在表的路径**与**键名**用 `.` **拼接**的结果，例如：

```yaml
database:
    type: MySQL
    credentials:
        user: skjsjhb
        pwd: SUPER_SECRET_VALUE_DO_NOT_SHARE_OR_YOU_WILL_BE_FIRED
```

其中 `pwd` 的路径就是 `database.credentials.pwd`。

`get` 方法的返回值就有点奇怪了，它是 `Object`，在 Kotlin 中对应的是 `Any?`。这两个东西的含义代表“任何对象”，也就是说，`get` 方法的返回值**可能是任何东西**！这是因为 YAML 是一种数据文件，Kotlin（和 Bukkit）在读取它之前，并**不能确保某个键的类型**。在我们的配置文件里，`enable` 是逻辑值，但如果换一份 YAML，那么这个值可能是数字、字符串甚至压根不存在！

为了让返回值“适配”任何类型，`get` 方法就使用 `Object`（即 Kotlin 中的 `Any?`）来兜底，意思就是“返回值的内容至少与 `Any?` 一样丰富”。还记得我们先前提到过的吗？**派生类的对象可以当作基类对象使用**，而在 Kotlin 中，`Any` 是所有对象的基类（那个 `?` 我们稍后再解释），所以可以说，**任何对象都是 `Any`，任何类也都是 `Any` 的派生类**，所以它们的内容一定比 `Any` 多。遗憾的是，`Any` 的内容实在太过贫乏了，这种保证也仅仅是“比没有强一点”，我们无法通过 `Any` 获知更多关于这个对象的信息了。

那么，该怎么解决呢？我们已经知道，`enable` 对应的值是逻辑值，那么 Bukkit 在读取配置文件时，也一定将对应的值转换成了 `Boolean`（Kotlin 中逻辑值所属的类），因此，**`isEnabled` 的实际类型一定是 `Boolean`**，Bukkit 知道，我们知道，唯独 `get` 方法不知道！那么好，我们就来让它知道知道：

```kotlin
val isEnabled = config.get("enabled") as Boolean
```

`as` 运算符，称作**类型转换算符（Type Casting Operator）**，尝试将给定的值“当作”指定的类型返回。如果指定的对象是 `Boolean` 及其派生类，那么它告诉 Kotlin，“这个对象是 `Boolean` 类型”，否则它就会生气地抛出一个错误。换句话说，**`as` 尝试获取对象更具体的信息，但不保证成功**。

使用同样的方法，我们可以获取 `content` 的内容，只不过这次要使用 `String`：

```kotlin
val content = config.get("content") as String
```

这样我们就完成了配置文件的读取。

### 读取键内容（优雅地）

上面的做法，在功能上确实还算 OK，但是存在两个相当致命的问题，都是因为 `as` 的使用：

- 这样的代码看上去很奇怪。（当然，你可能不会这么认为……）
- 如果 YAML 中实际的类型与我们预期的不一样，**程序就会出错**。

也就是说，如果管理员将配置文件修改成这样（可能是故意的，更多时候是~~有意的~~不小心的）：

```yaml
enabled: ture
content: Welcome to my Paper server!
```

像这种把 `true` 拼写成 `ture` 的错误在服务器运维中非常常见。由于 YAML 的字符串可以不加引号，因此如果 YAML 不理解某个值的含义，就会将它当作字符串。当 `enabled` 的值是 `true` 时，YAML 把它解释为逻辑值，而当对应的值是 `ture` 时，YAML 则将它解释为字符串。

如果实际的配置文件修改成这样，我们的插件在读取 `enabled` 的时候，就会出错：

```log
[25:61:61 ERROR]: Error occurred while enabling Anno v1.0 (Is it up to date?)
java.lang.ClassCastException: class java.lang.String cannot be cast to class java.lang.Boolean (java.lang.String and java.lang.Boolean are in module java.base of loader 'bootstrap')
        at anno-1.0-SNAPSHOT.jar/Main.onEnable(Main.kt:6) ~[anno-1.0-SNAPSHOT.jar:?]
        at org.bukkit.plugin.java.JavaPlugin.setEnabled(JavaPlugin.java:280) ~[paper-api-1.21.4-R0.1-SNAPSHOT.jar:?]
        at io.papermc.paper.plugin.manager.PaperPluginInstanceManager.enablePlugin(PaperPluginInstanceManager.java:202) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at io.papermc.paper.plugin.manager.PaperPluginManagerImpl.enablePlugin(PaperPluginManagerImpl.java:109) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at org.bukkit.plugin.SimplePluginManager.enablePlugin(SimplePluginManager.java:520) ~[paper-api-1.21.4-R0.1-SNAPSHOT.jar:?]
        at org.bukkit.craftbukkit.CraftServer.enablePlugin(CraftServer.java:657) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at org.bukkit.craftbukkit.CraftServer.enablePlugins(CraftServer.java:606) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at net.minecraft.server.MinecraftServer.loadWorld0(MinecraftServer.java:743) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at net.minecraft.server.MinecraftServer.loadLevel(MinecraftServer.java:488) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at net.minecraft.server.dedicated.DedicatedServer.initServer(DedicatedServer.java:322) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at net.minecraft.server.MinecraftServer.runServer(MinecraftServer.java:1163) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at net.minecraft.server.MinecraftServer.lambda$spin$2(MinecraftServer.java:310) ~[paper-1.21.4.jar:1.21.4-211-6ea4202]
        at java.base/java.lang.Thread.run(Thread.java:1583) ~[?:?]
```

这种大篇的错误在服务器控制台上刷屏的时候，就会让人非常抓狂。此外，Kotlin 也不是什么脾气很好的语言，当你的程序出现了错误而又没有自己处理的时候，它就会帮你处理 —— 直接将你的程序停止掉。

错误消息 `class java.lang.String cannot be cast to class java.lang.Boolean` 告诉我们，`get` 方法返回的是一个 `String` 类型，而我们尝试将它转换成 `Boolean` 类型，它不知道怎么做。如果是你，你知道吗？

你可能会想，如果我们能事先对 `get` 的返回值做一些检查，再做类型转换，也许就能解决问题。不过实际上不需要这么麻烦，因为 Bukkit 已经为我们提供了这样的功能，这就是 `get` 的一系列衍生方法：

```kotlin
/**
 * 获取由 `path` 指定的键所对应的内容。
 * 尽可能尝试将获取的值转换为相应的类型。
 * 如果指定的键不存在，或者无法转换，则返回 `def` 作为默认值。
 */
fun getBoolean(path: String, def: Boolean): Boolean
fun getString(path: String, def: String): String?
fun getInt(path: String, def: Int): Int
// 以及很多其它的 getXXX 方法
```

顾名思义，`getBoolean` 方法尝试读取指定的键，将它转换成逻辑值，然后返回这个值，并确保它的类型也正确，其它 `getXXX` 方法也是如此。如果它们找不到相应的键或者没办法做转换，就会返回第二个参数 `def` 作为默认值，而不会导致错误。

使用这些方法来改写我们的代码，就会简单很多，而且程序也会变得更加健壮：

```kotlin
val isEnabled = config.getBoolean("enabled", false)                     // 默认不启用
val content = config.getString("content", "(Announcement Here)")!!      // 默认是一个占位字符串
```

:::warning 一点小问题

这里获取 `content` 键的时候，我们加上了 `!!` 进行转换，表示“此值非 `null`”。这是因为 Kotlin **认为 `getString` 有可能返回 `null` 值**。像这样的问题在 Java 中并不存在，因为 Java 不区分 `null` 值和正常的值，但 Kotlin 对此则非常敏感。我们在此加上 `!!`，告诉 Kotlin：“别担心了，绝对能行！”

:::

:::tip 术语库

**健壮（Robust）** 就是指程序即使是在很糟糕的情况下也能正常工作，或者不至于出现太大的问题。恰当地处理程序中的各种错误（例如 `as` 导致的转换错误），能提升程序的健壮性。

顺便一提，有人将这个词音译为所谓的“鲁棒性”，从语言学的角度来说，这种翻译很糟糕，应当避免在正式的文件中使用该词，而且最好在其它地方也不要使用。

:::

当然这些 `getXXX` 也都有不带默认值的版本，仅提供一个 `path` 就可以获取对应的键值，但它们会在失败时返回 `null`，关于 `null` 值的使用我们会在以后提到，这里就暂且当它们不存在吧（笑）。

## 处理事件

我们还是使用聊天信息发送公告，并通过 `PlayerJoinEvent` 事件来发现新加入服务器的玩家。

和先前一样，我们创建一个监听器对象来监听事件。不过，这次由于我们的监听器需要知道 `content` 变量的值（方便确定给玩家发送的消息），因此需要**把它放在 `onEnable` 方法里面**（因为 `content` 变量定义在那里）：

```kotlin
class Main : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
        val isEnabled = config.getBoolean("enabled", false)
        val content = config.getString("content", "(Announcement Here)") as String

        val eventHandlers = object : Listener {
            @EventHandler
            fun onPlayerJoin(ev: PlayerJoinEvent) {
                // 我们想在这里使用 content
                // 所以这段代码不能放在 onEnable 外面
            }
        }

        server.pluginManager.registerEvents(eventHandlers, this)
    }
}
```

注意这里定义对象时的语法发生了一点变化，由于 Kotlin 不允许在方法内用 `object XXX {}` 的语法定义对象，因此我们需要使用 `object {}` 的语法先创建一个**匿名对象（Anonymous Object）**，再把它赋给变量 `eventHandlers`。剩下的步骤，就都和以前一样，把监听器对象和插件本身传递给 `registerEvents` 方法就 OK 了。

*如果很好奇并且去查了 Javadoc 的话，你会发现 `server` 其实是 `JavaPlugin` 所属的 Getter 方法 `getServer` 在 Kotlin 中对应的属性，`pluginManager` 亦是如此。我们已经说过了，Bukkit 中确实有非常多这样的 Getter 和 Setter！*

这里我们添加了 `if`，根据 `isEnabled` 变量的值，也就是 `enabled` 键的值，决定要不要注册监听器。如果管理员将 `enabled` 键的值改为 `false`，那么事件注册会被跳过，插件的功能也就相应禁用了。

给玩家发送消息的代码如下：

```kotlin
val msg = Component.text(content)
ev.player.sendMessage(msg)
```

第一行和以前一样，我们使用 `Component.text` 来构造一条消息，第二行则使用 `sendMessage` 方法发送消息。先前我们使用 `broadcast`，不过这次由于我们只发给加入服务器的玩家，所以要用 `ev.player` 获取该玩家并发送消息。

*你或许又猜到了 —— `ev.player` 确实也是一个 Getter，由于 `PlayerJoinEvent` 继承自 `PlayerEvent`（即“与玩家相关的事件”），后者有个名为 `getPlayer` 的 Getter 方法，所以它转换成属性 `player`。这么复杂的继承和转换机制，或许也解释了尽管在 Paper 有如此翔实的 Javadoc 的情况下，仍然需要本书这样的文章存在的原因（笑）。*

`Player` 的 `sendMessage` 从 `Audience`（代表“可接收消息的人”）继承而来，签名如下：

```kotlin
/**
 * 以服务器的身份，将 `message` 对应的消息内容发送给该接收者。
 */
fun sendMessage(message: Component): Unit
```

:::note 植入式广告

前面已经出现过很多次像 `/** */` 这样的注释了，再不介绍就有点欺负人了（笑），这是因为 Kotlin（和 Java）中除了 `//` 这样的单行注释，还可以用 `/* */` 来注释多行内容：

```kotlin
/* 这是注释，即使
换行
也仍然是
注释，直到遇到 */

println("这里是代码")
```

把开头的一个星号换成两个，就可以用来放在某些定义的上方，当作是这段代码的文档。Javadoc 工具抓取这样的内容，并将它转换为美观的（至少在 Javadoc 发明的时候是这样）网站页面。虽然说是文档，但由于它被 `/* */` 包裹，所以也仍然算是一种注释。这种语法现在也被 JSDoc（JavaScript）、Doxygen（C、C++、C#）等绝大多数语言的文档工具使用，不过 Python 和 Ruby 是例外，因为它们的注释以 `#` 开头。

:::

最终，`Main.kt` 的代码看起来像这样：

```kotlin
import net.kyori.adventure.text.Component
import org.bukkit.event.EventHandler
import org.bukkit.event.Listener
import org.bukkit.event.player.PlayerJoinEvent
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
        val isEnabled = config.getBoolean("enabled", false)
        val content = config.getString("content", "(Announcement Here)") as String

        val eventHandlers = object : Listener {
            @EventHandler
            fun onPlayerJoin(ev: PlayerJoinEvent) {
                val msg = Component.text(content)
                ev.player.sendMessage(msg)
            }
        }

        if (isEnabled) {
            server.pluginManager.registerEvents(eventHandlers, this)
        }
    }
}
```