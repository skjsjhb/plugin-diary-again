---
sidebar_position: 1
---

# 10-1 检验、检验、检验

## 更高、更快、更强

你可能已经不止一次听到过“会写测试是区分小白和大佬的分界线”这种说法，这是有些片面，但对软件进行测试无疑是开发过程中的重要一环，插件也不例外。除非是为了在愚人节整整你的朋友，否则**任何软件在交付前都应当进行测试**。

应该说，对项目进行测试是从原型到最终产品的重要步骤之一，尽管测试很枯燥无趣，但为了让有趣的东西能继续给我们带来乐趣（而不是炸掉服务器），我们得做一些这样的工作。

进行测试的最主要方法是编写代码进行测试，也就是使用所谓的**测试程序**。

> Nyaci：不是只要放在服务器上，再输入几个命令看看就行了吗？

确实，之前我们一直在采取这样的手工测试方法，但这会带来几个问题：

- 当功能的数目增多时，要穷尽所有可能的情况是非常困难的。
- 每次修改代码都要重新测试，这会让工作量变得不切实际的大。

我们希望能有一种**自动化的工具**来测试我们的程序。你或许会想，AI 已经这么发达了，是不是有些 AI 工具能够做这样的分析呢？但遗憾的是，由于软件工程本身是一门相当复杂的学科，程序的运行状态又千变万化，因此想要写好代码然后“一键自动测试”仍然是只存在于想象中的能力。

## 单元测试原理

不过，虽然说没有任何一个程序能够自动阅读我们的源代码并进行测试，但我们可以退而求其次，用以下的方法，**用一个程序来对某个功能进行测试**：

1. **模拟**程序运行中可能的一种情况。
2. 在这种情况下**运行**程序。
3. 将程序的实际结果与期望的结果进行**比对**，看看是否正确。

例如，我们有下面这样的 `foo` 函数：

```kotlin
fun foo(a: Double, b: Double): Double = a / b
```

我们想要测试 `foo` 的正确性，就要做以下的工作：

1. 为 `foo` 模拟一种情况，`foo` 接受两个参数，所以我们可以随便指定两个，比如 `3.0` 和 `2.0`：
 
    ```kotlin
    val a = 3.0
    val b = 2.0
    ```

2. 调用 `foo` 并获取其结果：
 
    ```kotlin
    val c = foo(a, b)
    ```

3. 验证 `foo` 的结果（也就是 `c`）与预期值 `1.5` 是否一致：

    ```kotlin
    println("Is the answer correct? ${c == 1.5}")
    ```

这些用来创建参数并比对结果的代码就是**测试代码**，我们可以把它们放在一起，组成一个完整的程序：

```kotlin
fun main() {
    val a = 3.0
    val b = 2.0
    val c = foo(a, b)
    println("Is the answer correct? ${c == 1.5}")
}
```

这样我们只要运行这个程序，就可以知道 `foo` 在这种情况下的功能是否正确。

像这样模拟一种情况，并对一个功能进行测试的程序片段，就叫做一个**测试单元（Test Unit）**。测试所模拟出来的一种“情况”，叫做一个**测试用例（Test Case）**。

当然，只测试一种情况肯定是不够全面的，细心的读者很快就会发现，如果 `b` 的值为 `0.0`，程序就会出错。一个测试单元只能在**一种情况**下测试程序的**一个功能**，因此，需要编写许多测试用例，进行很多单元测试，对程序中**每种情况**下的**每个功能**都进行测试。这种使用大量测试单元的工作，就叫做**运行单元测试（Unit Testing）**。

有干劲的读者肯定已经开始在 `src/main/kotlin` 中新建文件了，不过由于手动编写测试程序再逐个运行还是太过麻烦，Gradle 为我们尽可能简化了这项工作，我们只要使用 Gradle 规定的一种格式来编写测试，它就能自动运行这些测试，并报告测试结果。

## 你的第一个测试

先前制作的插件，由于功能非常简单，因此我们将大部分代码都放在了像是 `init` 这种地方，这会让测试变得很困难。我们干脆新建一个项目来进行测试。

在 IDEA 中创建新项目（名称可以随意），作为演示，我们就暂且不添加 `plugin.yml`，这个文件是给 Bukkit 读取的，在测试的时候不需要使用。

添加如下的 `Main.kt`（不妨试试创建一个包？）：

```kotlin
class Main : JavaPlugin() {
    override fun onEnable() {
       val listener = object : Listener {
           @EventHandler
           fun onPlayerJoin(ev: PlayerJoinEvent) {
               ev.player.sendMessage(
                   Component.text(
                       sayHelloLoudly(ev.player.name)
                   )
               )
           }
       }

        server.pluginManager.registerEvents(listener, this)
    }
}

fun sayHelloLoudly(name: String): String {
    return "Hello, ${name.uppercase()}!!!"
}
```

这个插件和“迎宾广播”差不多，不过变成了只向加入服务器的玩家发送消息。`sayHelloLoudly` 组成一条消息，把玩家的名字**改成大写**以示强调。例如，当 `Player` 加入游戏时，`sayHelloLoudly` 会返回 `"Hello, PLAYER!!!"`。

我们想要测试 `sayHelloLoudly` 的功能，因此我们需要在 `src/test/kotlin`（注意不是 `main`）下添加一个文件 `MainTest.kt`，并在这里编写测试代码。测试文件的名称可以任意，不会影响测试的运行。

```kotlin
import moe.skjsjhb.mc.plugins.test.sayHelloLoudly   // 包名可能有所不同
import kotlin.test.Test
import kotlin.test.assertEquals

class MainTest {
    @Test
    fun testSayHelloLoudly() {
        val pn = "ThatRarityEG"
        val res = sayHelloLoudly(pn)

        assertEquals("Hello, THATRARITYEG!!!", res)
    }
}
```

和事件监听器有点类似，为了编写测试，我们必须先创建一个**测试类**（在这里是 `class MainTest`），其中的**方法**将被 Gradle 作为测试单元。为了让 Gradle 不至于误判，我们还需要在测试方法上**加上 `@Test` 注解**。同样的，方法名也可以任意选择，只要你能够辨认出来。

*`Test` 注解来自于 `kotlin.test` 包，请不要导入错误的注解，那样测试将无法运行。*

测试的代码写在 `testSayHelloLoudly` 中，实际上我们只是简单地调用 `sayHelloLoudly` 而已。唯一的新东西是 `assertEquals`，它判断提供的两个参数的内容是否相同，如果不同，它就**向 Gradle 报告错误**。也就是说，使用 `assertEquals`，我们就能让 Gradle 来判定函数的结果是否正确，而不需要在茫茫的日志大海中寻找测试的输出，这可太好了！

*除了 `assertEquals`，还有 `assertContains`、`assertNotNull` 等多种不同的 `assert`，用于方便地进行各种比对。*

## 运行单元测试

编写好测试后，展开右侧的 Gradle 面板，先前我们曾在这里使用 `jar` 任务构建插件，而现在，我们需要展开 `Tasks/verification`，并双击 `test`，这告诉 Gradle “运行我们的测试！”。

Gradle 会和 IDEA 同步开始运行测试程序，稍等一会儿，你将能在下方弹出的面板中看到测试结果：

![Unit Test Passed](/img/s2/unit-test-passed.png)

同时 IDEA 会在相应的测试方法左侧增加一个标记，代表“测试通过”，这说明 `sayHelloLoudly` 方法能正常运行，真是太好了！

所以总的来说，要在插件项目中使用单元测试，就需要这么做：

1. 正常编写待测试的代码。
2. 在 `src/test/kotlin` 中添加测试类，并在其中添加带有 `@Test` 注解的方法。
3. 在测试方法中调用待测试的函数，并通过 `assert` 系列方法验证其结果。
4. 在 Gradle 面板中运行测试。
5. 如果有错误，根据出错的测试，修正相应的代码。

使用这种流程的好处在于，每次增加新功能或者修改已有功能时，只需要**修改相应的测试**，再通过 Gradle 运行。即使项目中有成百上千个测试，Gradle 也能一下全部搞定，并且我们能很快找到出问题的地方。

:::info

`sayHelloLoudly` 是一个功能非常简单的函数，因此测试起来也很容易。然而，随着项目中的代码增多，要测试的功能会越来越多，编写测试本身也会越来越难，大家可能心里会打退堂鼓：“哎呀，写个测试这么麻烦，干脆别测了，听天由命得了。”于是就放弃掉写了一半的测试。

应该说，在刚开始接触单元测试的时候，有这样的想法是非常正常的。笔者希望大家能坚持在**每完成一个功能后，就编写相应的测试**。编写测试的确是软件工程中最枯燥无味的工作之一，但从项目的长远打算来说，单元测试能在整个项目的生命周期内都为其质量保驾护航。

:::