---
sidebar_position: 3
---

# 0-2 开发前的准备

这一节里我们来获取安装开发插件所需要的工具，以及测试插件所需的服务端、客户端等软件。

:::warning 现在还不晚

安装开发工具时需要对你的系统进行一些配置，这些配置可能会与已有的软件冲突，致使它们发生故障。

非常建议在继续前备份重要的数据，不要等到为时已晚！

:::

## 为什么选择 Kotlin

Minecraft 是使用 Java 编写的，要让我们的插件能被 Bukkit 加载进 Minecraft，我们就需要使用相同的语言，或者**与其兼容的语言**。

以往，Java 语言自身是开发的不二选择。Java 非常强大，但同时其代码的编写也非常麻烦和啰嗦。近年来，随着 Scala、Kotlin 这类更方便语言的出现，加上它们又与 Java 兼容（也就是说，能使用 Java 的地方几乎也能用 Scala 或 Kotlin 替代），也有不少模组和插件的开发者转向使用 Kotlin。Kotlin 在语法和逻辑上比 Java 更加简单，但是在很多地方都至少与 Java 一样强大，这也是本书选取 Kotlin 作为开发语言的主要理由。

如果你想要了解更多关于 Kotlin 的内容，非常建议你去 [Kotlin 官方网站](https://kotlinlang.org) 看看。没关系，我们会等你回来！

<details>
<summary>你是职业选手吗？</summary>

有经验的读者可以通过下面的代码简单了解一下 Kotlin 的特点，以及它与 Java 的相容性：

```kotlin
import java.net.URI
import java.nio.charset.Charset

fun main() {
    URI("https://example.com").toURL().openStream().use {
        println(it.readAllBytes().toString(Charset.defaultCharset()))
    }
}
```

</details>

## JDK

JDK，也可以叫做 Java SDK。Java，顾名思义，就是 Minecraft 开发所使用的编程语言。SDK，全称 Software Development Kit，翻译为“软件开发工具包”，顾名思义，是用来将源代码“转换”为最终产物的工具。编写出来的代码，必须要经过 SDK 转换，才能成为最终所需的 `.exe`、`.jar` 之类的文件。

等一下，刚才不是说要使用 Kotlin 吗？为什么这里又牵涉到 Java 了呢？这是因为，Kotlin 是一门架构在 JVM 之上的语言。如果你不认识 JVM 这个词，那也可以理解为 Kotlin 是一门基于 Java 创建的语言，也就是说，Kotlin 编译的一部分是通过 Java 完成的。这也是 Kotlin 能在插件开发中代替 Java 的重要原因之一。

<details>
<summary>你是职业选手吗？</summary>

Kotlin 支持多种不同的后端，例如 Kotlin/JVM 可以生成 Java 类在 JVM 上运行，Kotlin/Native 则可以直接针对平台生成原生代码，Kotlin/JS 能创建 JavaScript 代码等。此外，Kotlin 会将源代码直接编译为 Java 类，因此严格来说，Kotlin 的翻译（注意不是编译）过程并不需要 Java 编译器的参与。

不过上面这些说法对于新手来说还是太复杂了，因此就暂时理解成“Kotlin 在 Java 之上运行”吧（笑）。

</details>

所以总而言之，**要能用 Kotlin 写插件，我们就需要一个 JDK**。虽然它没办法仅凭一己之力直接把 Kotlin 代码转换成插件，但它在这个过程中的作用很重要。

安装 JDK 其实并不麻烦，也就是下载一个软件。我已经为你准备好了相应的链接：[镜像](https://mirrors.ustc.edu.cn/adoptium/releases/temurin21-binaries/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.6_7.msi) 和 [源站](https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.6_7.msi)。这些链接的内容都是相同的，可以随意选择一个下载。不过，要是你觉得“就这么直接拿走感觉好不礼貌”的话，也可以到 [官方网站](https://adoptium.net/zh-CN/temurin/releases/?os=windows&arch=x64&package=jdk) 手动下载。

*顺便一提，我们选择的 JDK 版本是 21，原因会在本书的后面部分讲到。*

:::tip 术语库

**镜像（Mirror）**，顾名思义，是一个站点（即**源站**）的复制品。镜像通常放置在距离客户端更近（或访问更快）的地方。当客户端需要某些资源时，可以不必去速度缓慢的源站寻找，而可以快速地从镜像下载。有时，如果源站出于各种原因无法访问，镜像也是一种替代方案。

:::

:::info 那样不行！

也许你的 Minecraft 启动器已经为你安装了“Java 环境”或者“JVM”，不管它们怎么说，很大可能这些环境无法用于开发。除非你明确知道如何使用启动器安装的 Java 开发工具，并且也知道它的版本绝对正确，否则最好是从头安装。

:::

下载完成后你会得到一个 `.msi` 文件，只需要安装它就可以了。为了不至于引发奇奇怪怪的问题，在安装过程中建议**不要改变任何选项（包括安装路径）**。

<details>
<summary>你是职业选手吗？</summary>

如果你使用 SDKMAN，那么可以使用如下命令安装 JDK 21：

```bash
sdk install java 21-tem
```

macOS 用户可以使用 Homebrew 进行安装：

```bash
brew install --cask temurin21
```

如果你在使用 GNU/Linux，我相信你知道如何安装 JDK（笑），只需要记住选择版本 21，并相应更新环境变量和替代关系即可。

</details>

安装完成后，打开操作系统的**终端**。终端就是**输入命令的地方**，在 Minecraft 里，要输入命令，需要按一下斜线 <kbd>/</kbd> 按键。而在操作系统中，打开的方式各有不同：

- Windows：按下 <kbd>⊞ Win</kbd> + <kbd>R</kbd>（<kbd>⊞ Win</kbd> 键在左侧 <kbd>Alt</kbd> 键的左边），在弹出的窗口输入 `cmd`，并按下 <kbd>Enter</kbd> 键（或单击”确定“）。
- macOS：点选“启动台”，在应用列表中寻找“终端”并打开。
- GNU/Linux：通常是 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd>，取决于你的发行版。

在打开的窗口中输入：

```bash
java -version
```

如果一切顺利，你将看到类似下面这样的内容：

```
openjdk version "21.0.6" 2025-01-21 LTS
OpenJDK Runtime Environment Temurin-21.0.6+7 (build 21.0.6+7-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.6+7 (build 21.0.6+7-LTS, mixed mode, sharing)
```

特别要关注第一行中的版本信息：`version "21.0.6"`，这对于接下来的步骤很重要。

:::warning 如果出问题

如果终端什么都没有输出，或者显示找不到文件，或者输出的版本不是 21，那么你可以再试一次，输入下面的命令（仅限于 Windows）：

```bash
"C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.6.7-hotspot\\bin\\java.exe" -version
```

这次应该一切都正常了。如果终端还是什么都没有输出，或者显示找不到文件，或者输出的版本不是 21，那么你可以到 `C:\Program Files\Eclipse Adoptium` 这个文件夹下看一下，然后把命令中的 `jdk-21.0.6.7-hotspot` 修改为正确的名称，再试一次。如果还不行，那么你就陷入大麻烦了！你可能需要找一位专业的开发人员来帮你解决这个问题。

对于 macOS 和 GNU/Linux 用户，请查阅包管理器的手册了解如何设置正确的 Java 可执行程序路径。

:::

这样我们的 JDK 就设置安装完成。

## IntelliJ IDEA

我们使用 IntelliJ IDEA 作为代码编辑器，这款由 JetBrains 开发的 IDE 真的是非常强大，不仅有非常厉害的自动补全能力，还集成了大量实用的 Java 开发工具。虽说是针对 Java 的 IDE，但用来编辑 Kotlin 代码也是同样得心应手。顺便一提，Kotlin 是 JetBrains 开发的哦！

:::tip 术语库

**IDE** 的全称是 Integrated Development Environment，集成开发环境。用大白话来说就是“带了很多工具的超级开发姬”。IDE 通常带有代码编辑器、编译器、项目管理器、调试器、代码检查器、性能评估程序等诸多功能，免去了分别获取这些工具的麻烦。

:::

IDEA 拥有两个版本，社区版完全免费，而专业版在提供更多的功能时也收取相应的费用。虽说专业版有更多的功能，但实际上绝大多数的开发项目，用社区版就完全足够了，插件开发也不例外。

*顺便一提，社区版的 IDEA 同样也是自由软件，它以 [Apache 2.0 许可证](https://github.com/JetBrains/intellij-community/blob/master/LICENSE.txt) 授权。*

虽然 IDEA 非常强大，但它的安装却非常简单，只需要下载安装包进行安装即可。同样，我已经为你准备好了 [下载链接](https://www.jetbrains.com/idea/download/download-thanks.html?platform=windows&code=IIC)，这是 Windows 版本的，不过其它操作系统的下载方式也能很容易地在 [官方网站](https://www.jetbrains.com/idea/download) 上找到。

下载完成后安装打开即可。第一次运行的时候，IDEA 可能会要求你进行一些设置，比如主题什么的，这些都按个人喜好来就好啦。

<details>
<summary>你是职业选手吗？</summary>

如果你已经有 Eclipse 或者 Visual Studio Code 等 IDE 了，那也可以继续使用它们。Kotlin 构建工具链完全依赖于 Gradle 进行安装，不需要额外的设置。不过，你可能需要安装 Kotlin 扩展才能对其进行代码高亮。

</details>

## Minecraft 服务端

严格来说，即使没有 Minecraft 服务端，也完全可以做出来一个插件。但是，仅仅编写代码而不进行测试，这么“纸上谈兵”做出来的插件，肯定也是漏洞百出的。为了进行测试，我们需要在一个实际的 Minecraft 服务端上运行我们的插件。

我们将使用 Paper 1.21.4 作为开发服务端，你可以从 [这里](https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/211/downloads/paper-1.21.4-211.jar) 下载所需的文件。如果这个链接的速度太慢，那也可以试试 [这个镜像](https://tlcdn-sync.mcsl.com.cn/core/Paper/1.21.4/build134/download)。不管下载下来的文件叫做什么，都请把它改名为 `paper-1.21.4.jar`，这样在稍后的教学中就不会引起混淆。

下载完成后，找一个方便的地方，新建一个空文件夹，并将下载的服务端放在里面。我们此后都会在这里测试插件，这个文件夹就被称作**服务端根目录**。

:::info 需要点魔法？

Minecraft 服务端启动时需要下载额外的文件，如果你的网络环境不是那么“流畅”，可能会导致第一次启动很缓慢或者无法启动。

为了解决这个问题，你可以下载 [这个文件](https://bmclapi2.bangbang93.com/v1/objects/4707d00eb834b446575d89a61a11b5d548d8c001/server.jar)，把它重命名为 `mojang_1.21.4.jar`，然后在先前的服务端根目录下建立一个名为 `cache` 的文件夹，将这个文件放在里面。完成后的目录结构应该像这样：

```
.
├── cache
│   └── mojang_1.21.4.jar
└── paper-1.21.4.jar
```

:::

接下来要**在服务端根目录中打开终端**。这有点麻烦，虽然我们之前已经打开过终端了，但通过那种方式打开的终端，其当前目录并不在我们的服务端根目录中，使用命令的时候就会出现各种问题。

在 macOS 和 GNU/Linux 上（大多数桌面环境），对着包含着 `paper-1.21.4.jar` 的文件夹空白处右键，点击“在终端中打开”或者类似的按钮，就可以在服务端根目录中打开终端。

在 Windows 上，则需要单击左上角的“文件”菜单，再点选“打开 Windows PowerShell”或者类似的按钮，并且在打开的窗口中输入如下命令：

```powershell
cmd.exe
```

才能进入正确的终端。

如果这个方法不管用，也可以按住 <kbd>Shift</kbd> 键再对着文件夹空白处右键，单击“在此处打开 PowerShell 窗口”，并输入上面的命令，也有同样的效果。或者，你可以单击地址栏（窗口上方写有当前路径的地方），在其中输入 `cmd`，并按下 <kbd>Enter</kbd>。三种方法最终的结果是一样的，哪一种可行，以后就还用这种方法。

打开终端后，键入下面的命令：

```bash
java -jar paper-1.21.4.jar
```

如果你在先前安装 JDK 时，只有输入完整路径才能获得正确的版本信息，那么在这里也请把 `java` 替换成完整的路径，`-jar` 及之后的部分不要变动。

如果一切正常，你将看到如下内容（由于完整的输出实在太长，这里省略了一部分）：

```
Applying patches
Starting org.bukkit.craftbukkit.Main

...

[21:17:56 INFO]: [PluginInitializerManager] Initializing plugins...
[21:17:56 INFO]: [PluginInitializerManager] Initialized 0 plugins
[21:17:56 WARN]: Failed to load eula.txt
[21:17:56 INFO]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info.
```

现在回到服务端根目录中，Paper 在刚才的过程中创建了很多新文件，并找到一个名为 `eula.txt` 的文件，将其打开，你将看到以下内容：

```properties
# By changing the setting below to TRUE you ...
# ...
eula=false
```

把 `eula=false` 改成 `eula=true`，然后关闭并保存文件。

回到终端中，按一下键盘上的上箭头按键，终端会自动填入你上次执行的命令。按下 <kbd>Enter</kbd> 键，再次尝试启动服务端。如果一切顺利，你将看到 Paper 的图形化界面弹出：

![Paper GUI](/img/contents/setup-env-1.png)

那么我们的服务端就算启动成功了。现在你可以点按窗口上的 × 按钮，或者在终端中输入 `stop` 来停止服务端。

---

至此，我们所需的所有开发工具都已经准备就绪了，接下来就让我们通过一个简单的插件项目，来大致了解一下插件开发的过程。顺便一提，并不需要编写任何代码！所用到的代码都会提供，而你只需要复制粘贴就行。