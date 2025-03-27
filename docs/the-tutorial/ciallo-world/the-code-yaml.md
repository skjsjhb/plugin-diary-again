---
sidebar_position: 2
---

# 1-2 我们从一张表开始

## 把名字和数据对应

要向 Paper 描述我们的插件，我们需要向它提供足够的信息：

- **名称**：这里是 `HelloWorld`。
- **入口点**：插件开始执行的地方，类似于 C 语言中的 `main` 函数，不过在插件开发中，这是可以自定义的。我们的项目中只有一个文件 `Main.kt`，因此程序的入口点是 `Main`。至于为什么如此命名，我们稍后会提到。
- **插件版本号**：插件的版本数据，可以用来管理更新，或者帮助服务器管理员了解插件的技术规格。一般来说，大多数软件的第一个版本都记作 `1.0`，这里我们也如此设置。
- **Minecraft 版本号**：插件针对的 Minecraft 版本，这里是 `1.21`。

这些信息可以组成一张表（名字换成了 Paper 所用的名称）：

| 名称 | 数据 |
|:-:|:-:|
| `name` | `HelloWorld` |
| `main` | `Main` |
| `version` | `1.0` |
| `api-version` | `1.21` |

把它的形式稍微改变一下，我们就得到下面的内容：

```yaml
name: HelloWorld
main: Main
version: 1.0
api-version: 1.21
```

看上去熟悉吗？这不就是我们在 `plugin.yml` 中写的东西嘛！对，恭喜你，你已经掌握了 YAML 文件的大部分语法。

## YAML 不是标记语言

*YAML 确实**是**一门标记语言，不过，这节的标题为什么这么写？如果你感兴趣，可以去搜索 YAML 的全称。*

**YAML** 是一种数据格式，其文件以 `.yaml` 或者 `.yml` 结尾。如果在服务器上操作过一些插件的话，你或许对它并不陌生，每次安装一个新插件，似乎都要雷打不动地修改 `config.yml`，对吧？因为 YAML 不过就是一张（或者一些）表，将一些名称（叫做**键**，例如 `name`）与一些数据（叫做**值**，例如 `HelloWorld`）对应起来，这种结构用来存储各种配置项再合适不过了。

YAML 的基本语法是：

```yaml
键名: 数据
```

中间以英文半角冒号（代码中几乎所有的符号都要通过英文半角输入）以及一个空格连接，也就是 `: `。冒号与空格都不能省略。

原则上，键名可以使用任意“看起来正常”的名字，只要它不包含上面的分隔符 `: `，也就是说，用中文、日文乃至表情都没问题（`Ciallo～(∠・ω< )⌒☆: 1234` 同样是有效的 YAML）。不过曾经有人写出过 `pei置` 这样的键名，这看上去很……奇怪，所以希望你不要成为下一个。

为了规范起见，通常都使用小写英文字母、数字与连字符 `-` 的组合，例如 `my-key` 或者 `db-password` 这样。

## 在表中嵌入表

在 YAML 中，数据除了可以是数字或者各种文本，还可以是其它的表 —— 我们可以**在一张表里嵌入另一张表**！看上去有点奇怪，不过仔细想想，文件夹中也可以嵌套其它的文件夹，所以表中能嵌套表似乎也是理所应当的事情（笑）。

```yaml
my-key: 1000
my-table:
    text-to-say: ciallo, world
    some-number: 999
    who-am-i: ThatRarityEG
```

上面的 YAML 中，`my-table` 就与另一张表对应，或者说 `my-table` 的值是另一张表。这张表自身有三个键：`text-to-say`、`some-number` 和 `who-am-i`，分别对应各自的值。需要注意，被嵌入的表需要比它的键多缩进一级，也就是放置得更靠右。

:::tip 术语库

**缩进（Indent）** 就是指在每行代码前加上一些数量的空格（通常是 4 个的倍数），这有助于区分代码的层次结构。每加上 4 个空格就代表缩进一**级**，因此就会有二级缩进，三级缩进等：

```yaml
root: 这里没有缩进
tbl:
    sub: 这里缩进 1 级（4 空格）
    sub-tbl:
        sub-sub: 这里缩进 2 级（8 空格）
```

:::

当然了，被嵌套的表中也可以进一步嵌套其它表，以此类推，就像套娃一样。虽然人们常说禁止套娃，不过在软件工程中，表中表中表是非常常见的结构，你或许在哪里见到过类似下面这样的配置：

```yaml
database:
    type: SQLite
    file: ciallo.db
    pwd: SUPER_SECRET_VALUE_DO_NOT_SHARE_OR_YOU_WILL_BE_FIRED

users:
    ThatRarityEG:
        name: ThatRarityEG
        credit: 1000
        role: Admin
        removed: No
    HIM:
        name: HIM
        credit: 500
        role: User
        removed: Removing
```

这种清晰的层次结构既方便修改（相对的），也方便计算机读取（也是相对的）。

## 插件的简历

现在回到 `plugin.yml`（完整路径是 `src/main/resources/plugin.yml`）。我们已经知道，YAML 文件不过就是一些表。`plugin.yml` 中的表，就是向 Paper 告知插件信息用的。每个 Bukkit 插件都**必须**有 `plugin.yml`，Bukkit 和 Paper 依靠它来识别插件，如果这个文件缺失，插件就无法被正常加载。

`plugin.yml` 中的键，先前已经介绍过：

```yaml
name: 插件名称
main: 入口点
version: 插件版本号
api-version: Minecraft 版本号
```

这当然不是全部，`plugin.yml` 中还能包含权限、命令等更多更复杂的内容，不过如果是最低要求的话，只需要填入这四项，就足以让 Paper 加载我们的插件了。

现在来试试修改一下插件名吧！在项目面板中打开 `plugin.yml`，将 `name` 后的 `HelloWorld` 修改成其它你喜欢的名字，重新构建插件（双击 `jar` 选项），将 `build/libs/hello-world-1.0-SNAPSHOT.jar` 复制到服务器的 `plugins` 文件夹中，然后启动（或重启）服务器。你应当在日志中看到修改后的插件名称。