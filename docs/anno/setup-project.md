---
sidebar_position: 3
---

# 3-3 使用配置文件

现在就来着手开发新插件吧！还是和以前一样，在 IDEA 中创建一个新项目，并填写相关的信息。你可以使用 `anno` 作为插件名称，或者自行命名。在项目创建后，相应修改 `build.gradle.kts`，并创建 `src/main/kotlin/Main.kt`，继承 `JavaPlugin`：

```kotlin
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
    }
}
```

以及 `src/main/resources/plugin.yml`：

```yaml
name: Anno
author: skjsjhb
description: Shows customized announcement to players.
website: https://bpd.skjsjhb.moe/docs/anno/setup-project
main: Main
version: 1.0
api-version: 1.21
```

*YAML 中除了列表之外的键都没有先后顺序之分，将元数据（名称、网站）排在技术性信息（主类、版本）之前只是笔者的个人喜好。*

## 创建和保存默认配置文件

插件第一次运行的时候，服务器上是不存在配置文件的，因此我们需要**提供一份默认的配置文件**，Bukkit 会在首次运行时加载它。默认配置文件的名称是 `config.yml`，所以我们需要在 `src/main/resources` 下创建该文件：

```yaml
enabled: true
content: Welcome to my Paper server!
```

:::info 你的名字

Bukkit 单方面约定 `config.yml` 就是插件的配置文件名称，所以这个名字很重要，不能随意修改。

:::

然后我们需要在插件启用的时候让 Bukkit 保存默认配置文件。该使用哪个函数？上一节中已经介绍了相关的搜索方法，请试着自己找一下，无论是用搜索引擎查找，还是询问 AI，总之请先试一试。

你找到答案了吗？以下是用于保存默认配置文件的方法，不过在 Javadoc 中它是用 Java 书写的：

```java
/**
 * 保存插件的默认配置文件，稍后可使用 `Plugin.getConfig` 方法获取该配置。
 * 如果这个文件已经存在，则不进行任何操作。
 */
public void saveDefaultConfig()
```

Kotlin 的语法和 Java 很相似，只不过 Java 的类型都写在前面（参数的类型写在参数名前面，函数的返回值类型写在函数名前面）。上面的函数可以简单地翻译到 Kotlin 用法：

```kotlin
/**
 * 保存插件的默认配置文件，稍后可使用 `Plugin.getConfig` 方法获取该配置。
 * 如果这个文件已经存在，则不进行任何操作。
 */
fun saveDefaultConfig(): Unit   // Unit 代表无返回值
```

由于插件的配置可能随时在插件启用之后需要用到，因此保存配置文件最好就是在插件启用时执行，所以在 `onEnable` 方法中添加以下调用：

```kotlin
saveDefaultConfig()
```

就这么简单！Bukkit 在收到这个调用后就会检查服务器上存储的配置，如果没有本插件的配置文件，就会将我们提供的 `config.yml` 添加到服务器上。

## 获取配置文件内容……？

在保存了默认配置文件之后，如果想要使用配置文件中的数据，可以使用 `config` 属性。

> Nyaci：等一下，我看过 Paper 的 Javadoc 了，`JavaPlugin` 里面没有 `config` 属性呀？我倒是找到一个叫做 `getConfig` 的方法，为什么不用它呢？

啊，她说的是事实，这是 Java 和 Kotlin 代码之间交互时比较难懂的概念之一。要解释这个概念，会牵涉到 Getter 和 Setter 的概念，后者又关系到访问控制，而访问控制很大程度上又是类继承和开闭原则的产物……看来是时候在下一节中把先前没有说明的**类（Class）** 的概念，详细地向读者们介绍一下了。