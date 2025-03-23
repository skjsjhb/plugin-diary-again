---
sidebar_position: 4
---

# 2-4 编写初始代码

现在我们就来着手编写“迎宾广播”插件的代码。

## 创建项目

和你的第一个插件类似，在 IDEA 中创建一个新的项目，不过这次在填写项目信息时要注意两点：

- Name（名称）：你可以使用 `welcome-broadcast`，或者自行命名。需要注意，名称中不能有空格，而且最好只包含小写英文字母和连字符。
- GroupId（组名称）：这个选项在 Advanced Settings 下，在你的第一个插件中我们使用了 `com.example` 这样一个占位名称，现在是时候给它取一个更正式的名称了。组名称是用于标识一组项目的，与包名类似，使用点号 `.` 和小写英文单词分隔。

  :::tip 命名方法

  无论是 Kotlin 的包名，还是 Gradle 项目的 GroupId，通常都是将个人、组织或企业的域名倒过来写，再加上这一组项目的名称。本书将使用 `moe.skjsjhb.mc.plugins` 作为包名和组名，这是本书的域名 `skjsjhb.moe` 倒过来加上 `mc.plugins` 构成的。如果你没有个人域名，那么可以自己取一个昵称来替代。

  :::

其它选项仿照 1-1 修改为一致的值。

当项目创建完后，仿照 1-1 中的方法，将相应的代码添加到 `build.gradle.kts` 中，一直到“添加一些代码”那一节之前的操作，都需要在新的项目上重做一遍。如果在 Gradle 项目同步时遇到困难，也需要像先前一样设置代理或者镜像。每次创建新项目时都要这么做，此后就不再单独提及了。

## 创建入口点

和第一个项目一样，我们的插件需要一个入口点。还记得我们“复制”了 `JavaPlugin` 的内容吗？现在要做同样的事情。在 `src/main/kotlin` 下创建 `Main.kt`，并键入如下的代码：

```kotlin
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        println("This is the Welcome Broadcast plugin.")
    }
}
```

:::warning 熟能生巧

今后的代码就请自己键入，不要再复制粘贴代码了，那不利于提升编写代码的技能。

:::

`println` 是一个 Kotlin 内置函数，它**将指定的字符串输出到服务器的日志中并换行**。这里我们让插件在启用时输出 `This is the Welcome Broadcast plugin.` 字样，稍后在测试插件时，如果看到这行日志，我们就可以确认插件已经被启用了，这样在排查问题时就能更有目的性。 

在编辑代码时，你可以利用 IDEA 强大的自动补全功能来省下很多功夫。例如，在上面的代码中，你并不需要手动输入那些 `import`，只需要在 `Main` 后键入一个冒号，再输入 `JavaP` 几个字符，IDEA 就会像这样提供补全建议：

![IDEA IntelliSense](/img/contents/welcome-broadcast-1.png)

此时按下 <kbd>Tab</kbd>（在有多个选项时还可以使用上下箭头选择），即可将 `JavaPlugin` 类，以及相应的 `import` 自动插入到代码中。类似的，在插入 `onEnable` 时，不需要麻烦地键入 `override fun` 等一大堆东西，只需要在 `{}` 里的随便什么位置输入 `onE` 这样的前缀，就能得到相关的建议：

![IDEA IntelliSense](/img/contents/welcome-broadcast-2.png)

按下 <kbd>Tab</kbd> 即可将对应的代码插入到文件中（你可能需要删除 IDEA 插入的 `super.onEnable()` 这样的调用）。

## 填写插件信息

和 1-1 中一样，在 `src/main/resources` 下创建 `plugin.yml`，并填入下面的内容：

```yaml
name: WelcomeBroadcast
main: Main
version: 1.0
api-version: 1.21
```

这里 `name` 是可以自定义的，不过只能使用大小写英文字母、数字、连字符和下划线，不能有空格。当然，如果你想让插件信息更完善一些，也可以像下面这样添加简介、开发者和网站信息到这个文件中：

```yaml
author: skjsjhb
description: Sends welcome message to everyone when a player joins.
website: https://bpd.skjsjhb.moe/docs/welcome-broadcast/setup-project
```

这些都是完全可以自定义的，不过如果字符串值中有冒号与空格的组合 `: `，那为了不让 Bukkit 引起混乱，需要在值的两侧加上双引号。顺便一提，在编辑大多数文件的时候，IDEA 都会检查你的语法错误，并且会用红线标出它认为有问题的地方。

---

当你完成了这项模板代码后，你的项目应该就可以像 1-1 中一样构建并在服务器上运行了。为了验证这一点，你可以构建项目（在 Gradle 面板中双击 `jar` 选项），并确保构建面板中显示构建成功。你可以选择把构建出来的空插件拿到服务器上测试，只不过通常而言并没有这个必要。