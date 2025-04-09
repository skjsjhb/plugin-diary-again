---
sidebar_position: 2
---

# 7-2 创建和初始化项目

## 创建新项目

虽然说这次要添加依赖库，不过我们首先还是得创建项目，不然没有地方来存放我们的代码。创建项目的方法和之前的所有项目都完全一样，尽管这次要使用数据库，但项目的创建还是完全相同的。

`plugin.yml` 的内容如下：

```yaml
name: Backpack
author: skjsjhb
description: Extra inventory for players.
website: https://bpd.skjsjhb.moe/docs/the-tutorial/backpack/sketch
main: Main
version: 1.0
api-version: 1.21
```

这个插件也有命令，即用于打开背包的 `/backpack` 和 `/bp`，不过我们可以稍后再添加。 

`config.yml` 的内容如下：

```yaml
# 是否启用插件
enabled: true

# 背包的标题
title: 旅行背包

# 背包的大小，必须为 9 的倍数
size: 9

# 死亡后是否保留背包
keep-inventory: false
```

只需要修改配置文件，就可以决定玩家背包的大小，以及死亡时是否保留背包内容。和之前一样，我们在配置文件中插入注释，这样我们的配置文件是**自述的（Self Explanatory）**，用户即使不来访问我们的网站，仅通过阅读这些注释，也能知道各个配置项的功能。

## 添加依赖库

MapDB 是用 Kotlin 编写的库，为了使用它，我们需要将它加入到我们的项目中，换句话说，我们的项目**依赖**于 MapDB 才能运行。

还记得 `build.gradle.kts` 吗？现在是时候来正式介绍一下 Gradle 了，Gradle 是一个**构建系统（Build System）**，也就是把源代码和很多其它东西结合在一起，用来构建最终产品的工具。Gradle 负责以下工作：

- 组织程序源代码（例如为你创建 `src/main/kotlin` 文件夹）。
- 管理依赖库（寻找、下载并将它们放在可用的位置）。
- 按顺序使用正确的 JDK 编译源代码。
- 将编译结果和资源打包成 `.jar` 文件。

……以及很多其它的功能。

**管理依赖**也是 Gradle 的职责之一，Gradle 根据 `build.gradle.kts` 中的内容了解项目的结构，所以要添加 MapDB，我们就需要修改 `build.gradle.kts`。

打开 `build.gradle.kts`，找到下面的内容：

```kotlin
dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.4-R0.1-SNAPSHOT")
    testImplementation(kotlin("test"))
}
```

在 `{}` 内插入以下内容：

```kotlin
implementation("org.mapdb:mapdb:3.1.0")
```

`dependencies` 块中包含的是项目的**依赖库**，以函数调用的形式进行声明。要添加依赖库，需要向 Gradle 提供一个**标识符**，例如 `io.papermc.paper:paper-api:1.21.4-R0.1-SNAPSHOT` 就是 Paper API 的标识符，我们在开发插件的第一天就添加了它，这个库包含了我们之前用到的所有 Bukkit 类，例如 `JavaPlugin`、`Component`、`BossBar` 等。

现在我们添加标识符 `org.mapdb:mapdb:3.1.0`，代表 **“需要使用由 `org.mapdb` 开发的 `mapdb` 项目，版本 `3.1.0`”**。

做了这样的修改后，你需要**同步 Gradle 项目**，在 Gradle 面板的左上角单击 <kbd>Sync All Gradle Projects</kbd>，Gradle 会去寻找新添加的 MapDB 库，并将它下载到合适的位置。

![Gradle Import](/img/contents/ciallo-world-4.png)

这样我们就可以在我们的代码中使用 MapDB 了！是不是非常简单？我们既不需要访问各种网站，也不需要下载乱七八糟的文件，只需要添加一行代码，再“刷新”一下项目，依赖库就可以使用了。~~这么方便还真是抱歉呢（~~

如果你想要测试一下 MapDB 是否导入成功，可以在 `onEnable` 中找个位置键入 `DBMaker`，如果一切正常，IDEA 应该给出相应的补全提示。