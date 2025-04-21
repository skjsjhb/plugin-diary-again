---
sidebar_position: 3
---

# 9-3 附加源代码

## 被抛弃的注释

或许你会觉得 IDEA 的自动补全已经非常强大了，但在编写代码的过程中，你肯定不止一次对着弹出的一系列名字发呆，不知道各个方法的功能。的确，仅仅通过名称来推测各种东西的功能，实在是太过困难。单单看一个 `ConfigurationSection.getString` 方法，如果不去 Paper 的文档上查找，谁也不知道它会返回 `null`。

你或许会想，要是能像下面这样，在补全的时候让 IDEA **显示文档**就好了：

![IDEA Doc](/img/s2/idea-doc.png)

其实，Paper 的开发人员在编写代码的时候，已经在源代码中添加了相应的文档。然而，Paper 的代码是作为依赖库的形式，通过 Gradle 发布的（还记得 `compileOnly("io.papermc.xxx")` 吗？）。Gradle 在发布依赖库时，会将所有的源代码文件编译转换成 `.class` 文件，并在这个过程中**删除所有的注释**。由于文档也是注释的一种，因此它也同样被 Gradle（和 Java 编译器）删除。即使我们在 `build.gradle.kts` 将它作为依赖库添加，也找不到已经删除的文档。

*大家可能会觉得“Gradle 你真是多管闲事！”，但其实并非如此。`.class` 文件是设计给 JVM 执行的，而不是给我们阅读的，因此其中只包含运行程序所必需的信息。*

因此，我们必须通过其它的方式将源代码添加到我们的项目中。

## 找回源代码

你或许会想，既然我们的插件在 GitHub 上有源代码，是不是 Paper 也把源代码放在网上的某个地方了呢？也许可以编写一个程序，将源代码下载下来，再放在 IDEA 能找到的位置。

能这么想，说明大家的主观能动性已经非常高了，不过，其实还是不需要这么麻烦 —— Paper 在通过 Gradle 发布依赖库的同时，也同时发布了相应的源代码。我们只需要指示 Gradle：**“将源代码下载下来，并放在 IDEA 能找到的地方”** 就好了。

既然要修改 Gradle 的工作，那就需要修改 `build.gradle.kts`，所以我们赶快打开这个文件，然后看到最上方：

```kotlin
plugins {
    kotlin("jvm") version "2.1.10"
}
```

`plugins` 是 Gradle 所使用的插件。和 Bukkit 一样，Gradle 也提供了一套 API，允许开发者制作各种功能的插件。我们一直在使用的 `kotlin("jvm")` 就是 Kotlin 插件，它让 Gradle 能够处理 Kotlin 源代码。

现在向其中添加一个 `idea` 插件：

```kotlin
plugins {
    kotlin("jvm") version "2.1.10"
    idea
}
```

`idea` 是 Gradle 的内置插件之一，所以我们可以直接将它填在 `plugins` 中，不需要其它操作。`idea` 的功能，顾名思义，是将 Gradle 与 IDEA **连接**起来~~梦幻联动~~，允许 IDEA 从 Gradle 中获取信息 —— 包括我们所需要的源代码。

接下来在下方随便找一个空白的地方（当然，不能在任何 `{}` 中），添加以下的内容：

```kotlin
idea {
    module {
        isDownloadSources = true
    }
}
```

这段代码是对 `idea` 插件做配置，我们将 `isDownloadSources` 设为 `true`，告诉插件 “请下载所需的源代码！”。做了这样的修改后，`idea` 插件就会在下一次重新导入 Gradle 项目时**下载所有依赖库的源代码**。

现在就来试试吧！和先前每次改动 `build.gradle.kts` 一样，我们需要在 Gradle 面板中重新导入 Gradle 项目。然后，按着 <kbd>Ctrl</kbd> 键，并单击一下 `Main.kt` 中的 `JavaPlugin`，如果一切顺利，IDEA 就会显示 `JavaPlugin` 的源代码，并且还带有相应的文档：

![Reveal Sources](/img/s2/idea-src.png)

*如果看不到文档，或者上方显示的文件名不是 `JavaPlugin.java` 而是 `JavaPlugin.class`，那么肯定是哪里弄错了，请按照上面的步骤再做一次试试。*

## 补全时显示文档

最后要做的就是让 IDEA **在提供建议时显示文档**，这项功能默认是不开启的，需要我们手动打开。

单击左上角的 <kbd>File</kbd> 并选择 <kbd>Settings</kbd>，在弹出的设置页面中依次展开 <kbd>Editor</kbd> <kbd>General</kbd> <kbd>Code Completion</kbd>，并勾选右侧的 `Show the documentation popup in ... ms`。

![IDEA Settings](/img/s2/idea-src-settings.png)

现在回到项目中，随便键入几个字符，IDEA 就会像最上面那样，在提供建议的同时显示文档了！

<details>
<summary>你是职业选手吗？</summary>

如果你在使用 Eclipse，请使用 `eclipse` 插件，并添加如下的配置：

```kotlin
eclipse {
    classpath {
        isDownloadSources = true
    }
}
```

如果你在使用 Visual Studio Code，配置方法根据你所选的插件有所不同，请参考它们的文档。

</details>