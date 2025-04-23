---
sidebar_position: 3
---

# 10-3 测试覆盖率

## 多少才算太多

前面已经提到，只模拟一种情况进行测试，对于大多数功能来说都是不够的：程序可能对这种情况能正常运行，但换一个情况就出现问题。为了能覆盖尽可能多的情况，我们就需要编写更多的测试。

然而，盲目地增加测试数量对于增进程序的质量并没有太大的帮助。因为一个测试可能已经覆盖了程序的一部分，那么在编写下一个测试时，我们就希望能覆盖先前没有覆盖到的地方。换而言之，我们希望能知道**已有的测试已经覆盖了程序的哪些部分**，这样我们就可以针对还没有测试过的部分设计用例，并增加相应的单元测试。

衡量测试覆盖程度的指标就是**测试覆盖率（Coverage）**，它告诉我们在运行了这些测试后，程序的哪些部分已经得到执行。如果一段代码在测试中**从来没执行过**，那对应的部分肯定是没有经过验证的！

事实上，对于绝大多数的代码段，如果它在一种情况下正常运行，那么它大概率对于一般情况也是能正常运行的。因此，我们应该优先增加测试用例去覆盖尚未执行的部分，毕竟那些代码可一次都还没运行过，谁知道它们会做些什么！

## 评估覆盖率

Gradle 提供了一些插件来评估测试的覆盖率，并且需要一些配置。不过，我们目前还不打算使用这些插件，因为设计 IDEA 的人已经把 IDEA 与 Gradle 还有 Kotlin 所使用的测试系统集成了，我们可以直接在 IDEA 内运行测试并评估覆盖率。

在 Gradle 面板中展开 `Tasks/verification`，并在 `test` 上右键单击，选择 <kbd>Run ... with Coverage</kbd>，让 IDEA 在运行测试的同时计算覆盖率。稍等一会儿，测试就会运行完成，并且 IDEA 会生成一份覆盖率报告：

![Coverage Summary](/img/s2/coverage-summary.png)

这份报告会列出每份文件中已经覆盖到的类、方法、行和分支数，这次由于我们的程序非常简单，因此覆盖率都是 100%，但在项目规模进一步增大时，这些值很快就会开始降低，因为新增加的代码还没有相应测试。

要怎么知道代码的哪些部分已经测试过了呢？请保持刚刚弹出的覆盖率面板打开，IDEA 会在已经覆盖到的代码左侧以绿色粗线标记：

![Source Hits](/img/s2/source-hits.png)

*像是注解、方法参数列表之类的行不会被标出，因为它们不是可运行的代码，而只是一些声明，因此即使没有被标记也不用担心。*

在上图中，我们发现所有的可执行代码都已经被覆盖到了，这样非常好！不过，如果有该覆盖到的地方却没有覆盖到，那就是时候增加新的测试了，我们还是通过一个例子来说明。

## 未照耀的代码

在 `Main.kt` 中增加一个事件处理函数，在玩家退出时广播一条退出消息：

```kotlin
@EventHandler
fun onPlayerQuit(ev: PlayerQuitEvent) {
    server.broadcast(
        Component.text(
            "Bye, ${ev.player.name}"
        )
    )
}
```

最终的代码变成这样：

```kotlin
open class Main : JavaPlugin() {
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

            @EventHandler
            fun onPlayerQuit(ev: PlayerQuitEvent) {
                server.broadcast(
                    Component.text(
                        "Bye, ${ev.player.name}"
                    )
                )
            }
        }

        server.pluginManager.registerEvents(listener, this)
    }
}
```

现在再来评估一次测试覆盖率（在弹出的窗口中选择 <kbd>Replace Active Suites</kbd>），IDEA 所报告的覆盖率就不再是 100% 了：

![Coverage Not Full](/img/s2/coverage-summary-1.png)

回到 `Main.kt` 的编辑窗口，IDEA 会以红线标识没有覆盖的代码：

![Uncovered Lines](/img/s2/uncovered-lines.png)

这告诉我们“`onPlayerQuit` 中的内容尚未测试！”，这是当然的，因为我们还没有模拟“玩家退出服务器”的情况。

回到 `MainTest.kt` 中，并再增加一个测试用例，模拟玩家退出的情况：

```kotlin
@Test
fun testPlayerQuit() {
    val p = server.addPlayer("HIM")
    p.disconnect()      // 玩家断开连接
    p.nextMessage()     // 丢弃 Hello, HIM!!!
    assertEquals("Bye, HIM", p.nextMessage())   // 验证退出消息
}
```

和之前的一切都差不多，这次我们使用 `disconnect` 方法模拟玩家退出服务器的情况。同时，由于玩家加入服务器时已经收到过一条消息了，因此我们先使用 `p.nextMessage` 丢弃掉欢迎消息，再验证退出消息是否正确。

*由于 Bukkit 触发 `PlayerQuitEvent` 事件的时机是在玩家真正退出服务器之前的，因此玩家理论上会在退出前的瞬间收到广播消息，所以可以直接使用 `p` 进行测试，无需创建另一个玩家进行验证。另外，虽然玩家已经离开了服务器，但 MockBukkit 还是允许我们读取其收取的消息的。*

现在再运行覆盖率测试，IDEA 就应当报告 100% 的覆盖率了，很不错！

:::warning

虽然这里我们做到了 100% 的测试覆盖率，但其实在大多数大型的项目中，测试覆盖率并非越高越好 —— 或者至少应该说，测试覆盖率**并不能完全反映软件的质量**。一个项目可能拥有 100% 的测试覆盖率，但在实际应用中依然漏洞百出，而一个只有 70% 测试覆盖率的软件也完全可以是经得起时间和应用规模检验的。

读者应当明白，高测试覆盖率仅代表程序的大多数代码都**参与**了测试，但不代表它们中每一种可能的漏洞都能被测试**发现**。大家在编写和运行测试时，要始终关注程序的哪些部分确实需要增加测试，例如为新功能增加相应的用例，或者为关键的部分模拟一些极端情况进行检验，而不是简单追求一个纸面上的“覆盖率”数据。

:::

---

这样关于测试的部分我们就介绍完毕。虽然这个插件项目只是用来测试的，不过考虑到大家学习的需要，笔者也把代码放在了 GitHub 上，可以从 [这里](https://github.com/skjsjhb/plugin-diary-again-projects/tree/main/test-plugin) 查看。