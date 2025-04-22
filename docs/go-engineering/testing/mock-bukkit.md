---
sidebar_position: 2
---

# 10-2 走进 Bukkit 世界

## Test 掉出了这个世界

在上一节中，我们使用单元测试来测试 `sayHelloLoudly` 方法，而且一切都很顺利。不过，这种顺利只是因为 `sayHelloLoudly` 的功能实在是太过简单，如果我们想要测试更复杂的功能呢？例如，我们想确定是否正确监听了 `PlayerJoinEvent`，该怎么做？我们需要模拟玩家加入服务器，而这就不是一项简单的工作了。

在单元测试中，我们无法直接使用 Bukkit 的 API，各种事件也不会触发，这说到底是因为测试代码是**由 Gradle 直接运行的**，而不像插件源代码那样在服务器上运行。我们的测试代码由 Gradle 在 IDEA 中运行，它不知道什么是 `PlayerJoinEvent` 或者 `sendMessage`！换而言之，测试代码所运行的环境中没有 Bukkit（和 Paper）。

你或许会想，我们也许能通过一些方法把测试代码搬到服务器上，这的确是一种可行的方案，不过，启动一个真正的服务器是要消耗大量资源的，我们不必为了一个简单的测试就创建一整个世界。相反，我们可以**模拟一个服务器环境**，并在其中运行我们的测试。

Bukkit API 是一个复杂而庞大的库，在测试环境中实现它更是一项艰难的工作。幸运的是，已经有人为我们做了这样的事情，这就是 [MockBukkit](https://github.com/MockBukkit/MockBukkit) 项目，它允许我们在单元测试中模拟 Bukkit（和 Paper）。

## 用构想补足缺陷

MockBukkit 非常强大，能适用于绝大多数的测试场景，而要使用 MockBukkit 却非常简单，只需要在 Gradle 中**添加依赖** —— 我们已经做过类似的事情了。

打开 `build.gradle.kts`，找到 `dependencies` 块，并在其中添加如下的内容：

```kotlin
testImplementation("org.mockbukkit.mockbukkit:mockbukkit-v1.21:4.45.1")
```

`testImplementation` 和先前添加 MapDB 时使用的 `implementation` 功能相似，不过它只将依赖库添加到测试代码中。由于我们的源代码（`src/main/kotlin` 中的代码）完全不需要使用 MockBukkit（它们在真正的服务器上运行），因此这么做可以避免 Gradle 向插件的 `.jar` 中添加不必要的文件。

添加了这行代码后，重新导入 Gradle 项目，然后修改 `MainTest.kt`：

```kotlin
val server = MockBukkit.mock()  // 创建一个虚拟服务器
val plugin = MockBukkit.loadSimple(Main::class.java)    // 加载插件

class MainTest {
    @Test
    fun testPlayerJoin() {
        // 要做的测试之事……
    }
}
```

`MockBukkit.mock` 方法创建一个**虚拟服务器**，我们将它放在 `MainTest` 的外面，也就是文件顶层，以便稍后使用。这是因为测试类的执行比较特殊，如果将 MockBukkit 放在 `MainTest` 里而不妥善清理，测试就会出错。

`MockBukkit.loadSimple` 方法**加载指定的插件**，我们将插件主类 `Main` 传递给它。这里 `::class.java` 是 Kotlin 用于获取类信息的记号，暂且记住这样的用法就好。在加载插件后，MockBukkit 会自动启用插件，即调用 `onEnable` 方法。

由于 MockBukkit 的一些限制，我们需要修改 `Main.kt`，在 `class Main` 前加上 `open`：

```kotlin
open class Main : JavaPlugin() {
    // ...
}
```

这样 MockBukkit 才能正常加载我们的插件。

在做了这些操作之后，Bukkit 环境就准备就绪，插件也加载完成，我们现在**就好像在一个真正的服务器上**！MockBukkit 会设置好所有需要的类和方法，确保我们能像在正常服务器上一样使用它们。

那么，接下来我们就可以模拟“玩家加入服务器”了！做到这一点非常简单：

```kotlin
val p = server.addPlayer("ThatRarityEG")    // 创建一个虚拟玩家
assertEquals("Hello, THATRARITYEG!!!"，p.nextMessage()) // 查看玩家是否收到正确的消息
```

MockBukkit 扩展了 `server` 的功能，其中之一就是 `addPlayer` 方法，它可以创建一个虚拟玩家，将其加入服务器，并**触发相应的事件**。

在玩家加入服务器后，我们确信 `PlayerJoinEvent` 已经触发，并且我们的插件已经向新玩家发送了欢迎消息，那么我们就来验证这一点。`nextMessage` 方法**读取第一条未读消息**（即已经发送给玩家，但还没被测试代码读取的第一条消息），我们希望这条消息是 `Hello, THATRARITYEG!!!`，那样就能说明插件在正常运作。

*一般而言，在 `assert` 系列方法中，将期望的值写在前面，待测试的值写在后面。*

OK，测试编写完毕，注意到我们删除了 `testSayHelloLoudly` 方法，这是因为它的功能已经被包括在 `testPlayerJoin` 中了，只要输出的消息正确，我们不仅能确认事件正常触发，也同时能确认 `sayHelloLoudly` 函数的功能正常，这就是事半功倍！

现在在 Gradle 中运行 `test` 任务吧！如果一切顺利，IDEA 将显示测试通过的信息。

---

在 MockBukkit 中测试还有个好处，那就是你完全不用担心损坏服务器数据，或者受限于服务器的设置 —— 因为压根就没有真正的服务器！你大可以把世界铺满 TNT，以每秒六条的速度在服务器里“光速神言”，或者将 100 个 HIM 添加进服务器再踢出 —— 想做多过分的事情都行！最坏的情况也不过就是测试失败，Gradle 嘟哝着扔出几个错误信息而已。

我们会在后续的项目中再次用到 MockBukkit，不过你要是想现在就进一步探索它的功能，可以去看看 [MockBukkit 的文档](https://docs.mockbukkit.org/docs/en/user_guide/introduction/getting_started.html)。