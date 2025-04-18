---
sidebar_position: 1
---

# 9-1 让 Gradle 代劳

## 一遍，又一遍

在前面的项目中，你或许已经体验过“双击 `jar` 任务，把插件复制到服务器，键入命令”这件事情重复起来会有多无聊。重复的事情不仅做起来枯燥，不符合插件开发“快乐”的初衷，而且也容易忙中出错，例如忘了复制插件，不小心删除了服务端文件，或者在键入命令时把 `java` 打成了 `jvav` 之类。

像这样的错误无疑是会大幅降低开发效率的。软件工程师们虽然平时喜欢偷懒，但在追求效率这方面却是毫不含糊。计算机比我们更擅长**重复、可靠地做一件事情**，为什么不编写一个程序来完成上面的工作呢？嗯，你或许已经跃跃欲试了，不过已经有人为我们完成了这项工作 ——

## 全部都能搞定！

我们已不是第一次与 Gradle 打交道了，先前我们通过修改 `dependencies`，将 MapDB 和 Java TOTP 等依赖库添加到项目中，这是 Gradle 的**项目结构管理**功能，它能管理和维护项目所需要用到的文件。

Gradle 的另一大功能是**执行任务**，我们可以把开发过程中要做的事情做成 Gradle 中的任务，之后就可以在 Gradle 中执行。我们已经使用过这套系统很多次了：每次我们双击 `jar` 的时候，其实就是在运行 `jar` 任务。这个任务是 Gradle 内置的，它将 Kotlin 编译器编译出来的文件打包到一个 `.jar` 文件中，放置在 `build/libs` 目录下。

> Nyaci：诶等等，这些编译出来的文件是从哪来的呢？我们不是只有源代码吗？

嗯，这是一个有趣的问题。`jar` 任务自身只负责打包，而编译源代码的工作是由另一个任务 `compileKotlin` 完成的。`jar` 任务**依赖** `compileKotlin` 任务，当我们运行 `jar` 的时候，Gradle 会先运行 `compileKotlin`，生成 `jar` 所需要的文件，然后再运行 `jar`。

*这和工厂中的流水线很像：每道工序只负责一项工作，前一道工序完成后，才能进入下一道工序。*

而且，Gradle 很聪明，它会跳过不必要的任务。例如，假如源代码没有更新，Gradle 就不会重复运行 `compileKotlin`，因为编译的结果并不会有变化。

## 一键安装插件

既然 Gradle 可以运行各种任务，那么我们就可以把 **“复制插件到 `plugins` 文件夹中”** 做成 Gradle 任务，然后只要在 IDEA 中双击一下，插件就自动安装了！我们再也不需要手动复制插件文件，这么一想还是挺心动的，那么我们就来试试吧！

随便找一个插件项目（可以是我们先前做的任何一个），然后在 `build.gradle.kts` 的末尾（或者中间找个空位）添加如下代码：

```kotlin
tasks.register<Copy>("copyPlugin") {
    dependsOn("jar")
    from(tasks.jar.get().archiveFile)
    into("你的 plugins 文件夹路径")
}
```

你需要将 `into` 函数的参数替换成 `plugins` 文件夹的路径，另外，如果是在 Windows 上，路径的反斜线 `\` 需要使用两个反斜线 `\\` 替换，例如 `C:\\path\\to\\plugins`。

这样我们就创建了一个名为 `copyPlugin` 的任务，它会将生成的插件文件复制到 `plugins` 中。

- `<Copy>` 告诉 Gradle 我们要复制文件。
- `dependsOn("jar")` 表明这个任务依赖于 `jar`，因为我们要使用生成的 `.jar` 文件。
- `from` 和 `into` 指定来源和目的文件夹。
- `tasks.jar.get().archiveFile` 获取 `.jar` 文件（即插件文件）的路径。

虽然 `build.gradle.kts` 使用 Kotlin 语法，但你不必按 Kotlin 的方式去理解这些函数，Gradle 将 Kotlin 改造成了一种非常形式化的语法，大家只需要知道“哦，创建任务就是按这个格式写”就 OK 了。

现在就来试试新添加的任务吧！首先要重新导入 Gradle 项目（<kbd>Sync All Gradle Projects</kbd>），然后从 `plugins` 中删除已有的插件，接下来在 Gradle 面板中找到 `Tasks/other/copyPlugin`（注意不是 `Tasks/build`），双击运行一下，插件应当被自动复制到 `plugins` 中。

## 一键启动服务器

既然插件的安装能够自动化，那么是不是也能**通过 Gradle 启动服务器**呢？这样我们只要修改源代码，然后双击一下，连输入 `java -jar paper-1.21.4.jar` 的步骤都省掉了，服务器就能直接启动！

答案是肯定的，只需要添加下面的任务：

```kotlin
tasks.register<JavaExec>("startServer") {
    dependsOn("copyPlugin")
    workingDir("服务端根目录")
    classpath("到 paper-1.21.4.jar 的路径")
}
```

我们如法炮制，添加了一个 `startServer` 任务，它能启动服务器。

- `<JavaExec>` 告诉 Gradle 我们想运行一个 Java 程序。
- `dependsOn("copyPlugin")` 代表在启动服务器前，需要先复制插件。
- `workingDir("...")` 设置程序运行的工作目录，这里必须和**服务端根目录**保持一致，否则文件会生成在奇奇怪怪的地方。
- `classpath("...")` 包含要运行的 `.jar` 文件，这里要填入 `paper-1.21.4.jar` 的**完整路径**。

一切设置完成后，重新导入 Gradle 项目，然后双击运行 `Tasks/other/startServer`，稍等一会儿，服务器就会在 IDEA 中运行起来：

![Server Running Via Gradle](/img/s2/gradle-start-server.png)

非常好！这意味着我们以后再也不需要手动复制插件，或者通过命令重启服务器了！只需要修改源代码，然后运行 `startServer` 任务，Gradle 就会准备好插件并启动服务器。