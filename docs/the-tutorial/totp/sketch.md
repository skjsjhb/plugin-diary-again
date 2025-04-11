---
sidebar_position: 3
---

# 8-3 创建和初始化项目

## 创建项目并添加依赖

新建项目并正确地修改相应的文件，然后在 `build.gradle.kts` 的 `dependencies` 块中添加 Java TOTP 作为依赖：

```kotlin
implementation("dev.samstevens.totp:totp:1.7.1")
```

完成后记得要重新导入 Gradle 项目。

`plugin.yml` 内容如下：

```yaml
name: TOTP
author: skjsjhb
description: TOTP 2FA plugin for your server.
website: https://bpd.skjsjhb.moe/docs/the-tutorial/totp/sketch
main: Main
version: 1.0
api-version: 1.21

commands:
  totp:
    description: Enable TOTP or authenticate with TOTP code.
```

我们将使用同一个 `/totp` 命令来处理**启用 TOTP** 和**验证 TOTP**两种操作，如果用户提供了验证码，那就是验证，否则就是启用。

`config.yml` 内容如下：

```yaml
# 插件是否启用
enabled: true

# 验证器中显示的颁发者
issuer: Minecraft Server
```

TOTP 验证器中会显示每个密钥的颁发者，我们允许管理员通过修改 `issuer` 的值来自定义该名称：

![TOTP Example](/img/contents/totp-example.png)

这可以便于用户区分密钥的来源。

## 创建监听器

新建文件并创建 `TOTPListener` 监听器：

```kotlin
class TOTPListener(private val plugin: Main): Listener {
    // ...
}
```

*实际上，在已经做了这么多个项目后，你完全可以自由发挥，如果觉得都放在 `Main.kt` 里更方便，那也完全可以这么做，另外你也可以给监听器类取更好听的名字。你了解的知识越多，编写的代码就越不需要拘泥于定式。*

和以前不同的是，我们通过构造函数传递**插件对象**，而不是配置文件。这是因为我们想要在 `TOTPListener` 中使用插件的 `dataFolder` 属性，以便于稍后读写存储着密钥的文件。由于无论是 `config` 还是 `dataFolder` 都是插件对象的属性，因此直接传递插件对象更为简单。

我们顺便也把 `issuer` 的值提取出来：

```kotlin
private val issuer = plugin.config.getString("issuer", "Minecraft Server")!!
```

## 使用密钥文件

接下来我们创建**密钥文件**对象，我们计划使用 `secrets.yml` 来存储密钥，因此要将它提供给 `File` 的构造函数：

```kotlin
private val secretsFile = File(plugin.dataFolder, "secrets.yml")
```

并且将其中的内容读取出来：

```kotlin
private val secretsData = YamlConfiguration.loadConfiguration(secretsFile)
```

```kotlin
/**
 * 从指定的文件中读取 YAML 格式的数据。
 * 如果无法读取或解析文件，则返回空白内容。
 */
fun loadConfiguration(f: File): YamlConfiguration
```

`YamlConfiguration.loadConfiguration` 尝试从指定的文件中读取 YAML 数据，读取到的数据和配置文件是一样的，可以通过一系列 `getXXX` 进行操作。

由于这个文件是我们自行创建和读取的，因此在服务器关闭时需要**保存**，和上一章中一样，我们在 `TOTPListener` 中添加一个方法，这样就可以在 `Main.onDisable` 中使用它：

```kotlin
fun saveSecrets() {
    secretsData.save(secretsFile)
}
```

```kotlin
/**
 * 将 YAML 数据对象的内容存入指定文件。
 */
fun save(f: File): Unit
```