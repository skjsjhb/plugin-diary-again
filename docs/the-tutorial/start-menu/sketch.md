---
sidebar_position: 4
---

# 4-4 创建和初始化项目

和先前一样创建项目，你可以将其命名为 `start-menu`，也可以自行选用其它名称。别忘了正确地修改 `build.gradle.kts` 和其它相关文件。

## 配置文件

由于我们的插件有“自定义命令”的功能，因此需要在配置文件中添加相应的键。我们的配置文件设计如下：

```yaml
enabled: true
command:
  label: "Ciallo～(∠・ω< )⌒☆"
  run: "say Ciallo～(∠・ω< )⌒☆"
liftoff:
  velocity: 5
```

> Nyaci：……所以你是柚子厨，对吗？

Maybe.

这里我们允许管理员通过修改 `command.label` 来改变按钮的标签（即显示的文本），`command.run` 来改变要执行的命令（命令没有前缀 `/`）。此外，我们还给“快速起飞”功能增加了一个可调的 `liftoff.velocity`，允许管理员决定起飞的动量（或者说速度）有多大。

另外我们保留了先前的 `enabled` 选项。基本上来说，每个插件都会有一个选项开启或关闭插件功能，这是因为从 `plugins` 中移除和添加插件是相对麻烦的，而修改配置文件则简单很多。

## 插件信息

和先前一样，我们创建 `plugin.yml`：

```yaml
name: StartMenu
author: skjsjhb
description: A tiny menu with custom command support.
website: https://bpd.skjsjhb.moe/docs/the-tutorial/start-menu/sketch
main: Main
version: 1.0
api-version: 1.21
```

但是还没完！如果我们的插件要使用命令，需要在 `plugin.yml` 中添加它。向 `plugin.yml` 中再增加以下内容：

```yaml
commands:
  menu:
    usage: /menu            # commands.menu.usage，命令用法说明
    description: 打开菜单    # commands.menu.description，命令简介
```

Bukkit 规定命令必须填在 `commands` 键下，即 `commands` 是一张表，它的键是**命令名称**（在这里是 `menu`），值又是一张子表，其中包含命令的一些属性，通过上面的缩进关系不难看出它们的层级，在编辑代码时，大家也要使用正确数目的空格。

`usage` 描述命令的用法，`description` 则对命令的功能做个简要说明，这些信息会在有人输入 `/help 你的命令` 的时候显示出来。除此之外，命令还有一些其它属性可以设置，不过限于篇幅，无法在这里展开说明了。

所有的键都是可选的，因此理论上，最少只需要下面的代码就可以添加一条命令：

```yaml
commands:
  menu: {}  # {} 表示空白表
```

但是这么做不太好，因为当用户输入 `/help menu` 而找不到任何提示信息的时候，他们会非常沮丧。

## 主程序

在 `Main.kt` 中添加以下内容（你应该已经对此感到得心应手了）：

```kotlin
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
    }
}
```

由于这次我们要用到更多的事件处理器，再把整个 `object` 都放在 `onEnable` 中就不合适了。我们可以选择不再使用 `object` 就地创建监听器，而**使用一个类来描述监听器**，利用构造函数**传递**配置对象：

```kotlin
class EventHandlers(
    private val config: ConfigurationSection  // 比使用 FileConfiguration 更泛用
) : Listener {
    // 可以在这里使用 config 获取插件配置
}
```

这里我们向 `EventHandlers` 中添加了一个私有属性 `config`，用来存储插件读到的配置，这样我们就将监听器的内容与主类分离开来。我们将 `config` 放在构造函数参数列表中，这样稍后创建对象时，这个位置的参数就会被自动赋给该属性，希望你还没忘记这一点（笑）。

:::note 宽以待人

选择 `ConfigurationSection` 作为 `config` 的类型，正是印证了上一节中关于接口的用法，即 **“如果可能，就总是使用基类的类型，而不是具体类型”**，避免对对象施加超出必要范围的限制。

从 `JavaPlugin` 的 `config` 属性获取的是 `FileConfiguration`，但我们只使用到其中的 `getXXX` 等方法，通过查阅 Javadoc，我们得知这些方法来自于 `ConfigurationSection`，那么选择它作为类型就比 `FileConfiguration` 更好，因为我们**并不需要 `ConfigurationSection` 以外的功能**就足以读取配置信息。

:::

![Javadoc Interface](/img/contents/javadoc-interface.png)

现在，向 `onEnable` 中添加如下代码来实例化 `EventHandlers` 并将它注册（还记得吗，类只是蓝图）：

```kotlin
if (config.getBoolean("enabled", false)) {
    server.pluginManager.registerEvents(EventHandlers(config), this)
}
```

由于通过 `EventHandlers(config)` 创建的对象此后不会再使用，因此就不必创建额外的中间变量，直接将它作为参数传递就好。

到目前为止，`Main.kt` 的内容如下：

```kotlin
class Main : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
        if (config.getBoolean("enabled", false)) {
            server.pluginManager.registerEvents(EventHandlers(config), this)
        }
    }
}

class EventHandlers(
    private val config: ConfigurationSection
) : Listener {
}
```