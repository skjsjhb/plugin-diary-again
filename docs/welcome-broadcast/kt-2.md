---
sidebar_position: 2
---

# 2-2 搭上 Kotlin 号出发（下）

## 发现、创造和使用魔法

当程序中的代码逐渐增加时，你可能会遇到这样的情况：

```kotlin
var a = 2
var b = a * 3 + 1

var c = 4
var d = c * 3 + 1

var e = 999
var f = e * 3 + 1
```

注意 `b`、`d` 和 `f` 的定义，它们都是把某个变量乘 `3` 再加上 `1`，像这样的逻辑我们重复写了三次，有没有什么办法将这个“动作”提取出来，以减少代码的重复呢？

我们可以使用**函数（Function）** 来改进代码。函数是提前打包好的一小段（也可能是一大段）代码，能执行一系列定义好的操作，并且可以在程序的各处根据需要使用。下面是修改后的代码：

```kotlin
fun foo(arg: Int): Int {
    return arg * 3 + 1
}

var a = 2
var b = foo(a)

var c = 4
var d = foo(c)

var e = 999
var f = foo(e)
```

我们定义了一个函数，名为 `foo`。它从外界接受一个**参数（Parameter）** `arg`，类型为 `Int`，对它做一些操作（在这里是 `arg * 3 + 1`），然后返回一个 `Int` 类型的值。这些信息都以 `fun 函数名(参数: 类型, 参数: 类型, ...): 返回值类型 { 块 }` 表示。

这有点复杂，我们将它拆开来看：

- 首先是 `fun` 跟上**函数名**，代表“定义函数”。
- 然后是 `()` 内的**参数列表**，代表函数要从外界接收的信息。参数之间以 `,` 分隔，每个参数都以 `名称: 类型` 的形式定义，类型不能省略。在上面的例子中，函数 `foo` 只有一个参数，名为 `arg`，类型是 `Int`（整数）。
- 接着是 `: ` 后跟随的**返回值类型**，代表函数完成工作后所产生的值类型。
- 最后是 `{}` 包裹的**函数体**，代表函数要做的工作。

当函数定义后，可以通过 `函数名(参数值, 参数值, ...)` 的形式使用，称作**调用（Call）**。参数值是对号入座的，传递给函数的第一个**参数值**会赋给函数体中的第一个**参数变量**（有点拗口！），以此类推。函数调用本身也是一个表达式，它的值是函数的返回值。

在上面的例子里，当我们调用 `foo(a)` 的时候，实际上是把 `a` 所指代的值“绑定”到 `foo` 的参数 `arg`，然后执行 `foo` 中的代码。`foo` 使用 `arg` 计算出来一个值，并且返回到调用 `foo(a)` 的地方，随后这个值被赋给 `b`。

如果还需要更多说明的话，以下是两个参数情况下的图解。

![Functions](/img/contents/kt-fun.png)

如果函数没有参数，可以简单将参数列表留空。如果函数没有返回值，那么返回值类型可以使用 `Unit` —— 一个特殊的空类型。此外，Kotlin 可以根据函数的代码自动推断返回值类型，但对于复杂一点的函数来说，最好还是手动指定。

使用函数除了简化工作外，最大的好处是**使用函数的人不需要关心函数内部的代码**。例如，假设让你写一个程序，将指定的玩家踢出服务器，你可能不知道怎么把这个玩家从玩家列表移除，又是如何让服务器与那个玩家断开连接，但这不重要，因为如果有人给你提供了这样的一个函数：

```kotlin
fun kickPlayer(name: String): Unit {
    // 不用考虑内部的细节
}
```

虽然你不知道踢出玩家的具体过程，但是有了这个函数，你立刻就可以使用它：

```kotlin
kickPlayer("HIM")
```

Bukkit 中有很多像 `kickPlayer` 这样的函数，提供了访问和修改世界，与玩家交互和各种其它方面的许多功能，Bukkit（和 Paper）已经写好了需要的代码，我们只要使用它们就行。

## 我们联合！

在实际的项目中，要完成某个任务，牵涉的变量和函数可能相当多。例如，对于 Minecraft 中的一把镐，可能需要类似这样的代码：

```kotlin
var name: String        // 物品名称
var durability: Int     // 耐久度
var material: Material  // 材质

fun canBreak(name: String, material: Material, block: Block): Boolean     // 检查能否破坏给定的方块
fun repairWithXP(durability: Int, xp: Int): Unit                          // 使用经验修补修复该物品
```

*这里使用了未初始化变量的语法，即在变量名称后明确指定类型，但暂时不对其赋值。由于使用 `var` 进行定义，这些变量可以稍后再初始化。*

真正的代码比列出的这些还要长几十上百倍，如果这些变量和函数都分散地放在源代码的各个位置，很快我们就会陷入“这个函数是做什么的”或者“需要的那个变量到底在哪里”之类的问题中。此外，为了给函数传递足够的信息，参数列表会变得非常长，导致编写代码的大部分时间都浪费在复制粘贴参数上。

为了解决这些问题，我们可以**将属于某样东西的变量和函数关联起来**，创建一个**对象（Object）**：

```kotlin
object Pickaxe {
    var name: String        // 物品名称
    var durability: Int     // 耐久度
    var material: Material  // 材质

    fun canBreak(block: Block): Boolean     // 检查能否破坏给定的方块
    fun repairWithXP(xp: Int): Unit         // 使用经验修补修复该物品
}

// 使用的例子
Pickaxe.name                    // 取得镐的名称
Pickaxe.repairWithXP(10000)     // 修复这把镐
```

对象使用 `object 对象名 { 对象内容 }` 定义，在 `{}` 中定义内容的称为对象**成员（Member）**。定义了一个对象后，我们可以做以下两件事情：

- 对象内的函数可以**直接使用**对象所拥有的变量和其它函数，而不需要将它们作为参数传入。
- 对象的所有数据和行为都和对象名称**关联起来**，可以通过 `对象值.成员` 来访问。

  :::note 组成原理

  和先前运算符那里一样，这种访问方式使用的是对象**值**而不是对象**名**，意味着如果有个表达式的值是对象，那么直接在该表达式后加上 `.成员`，就可以访问相应对象的成员。

  :::

这样我们就把“在茫茫的变量大海中找到需要的变量 / 函数”变成了“在对象的成员中找到需要的变量 / 函数”。如果这些你都理解的话，那么恭喜，你已经理解了**面向对象编程（OOP）** 的半壁江山。

总的来说，**对象就是将属于同一样东西的变量和函数关联起来**。属于对象的变量称作**属性（Properties）**，而属于对象的函数称作**方法（Method）**，属性描述对象的特性，而方法描述对象的行为。

现在是时候介绍一个重要的概念了：

**在 Kotlin（和 Java）中，一切都是对象。**

不论是数字、字符串，还是Minecraft 中的方块、物品，都是对象。属性是对象，函数的返回值是对象，甚至就连函数本身也是对象。既然是对象，那它们就同样有属性和方法。下面列举一些类型为 `Int` 的对象的方法，这些都是设计 Kotlin 的人提前为我们编写好的：

```kotlin
var a = 10

a.toString()            // "10"，将数字转换为字符串表示
a.coerceAtLeast(12)     // 12，返回对象自身与所给参数中较大的值
a.floorDiv(4)           // 2，返回对象自身除以所给参数的结果，但向下取整
a.until(20)             // 返回一个 Range 对象，代表由 10 到 19 的整数
```

当然，既然方法的返回值是对象，那么就可以进行下面这样的**链式调用（Chained Call）**：

```kotlin
var a = 100
a.floorDiv(3)           // 返回 33
 .coerceAtLeast(45)     // 相当于 (33).coerceAtLeast(45)，返回 45
 .plus(5)               // 相当于 (45).plus(5)，返回 50
 .toString()            // 相当于 (50).toString()，返回 "50"
```

对于较短的链式调用，也可以合并在一行中写完。

## 整理和分装

当项目中的对象逐渐增多的时候，给它们分别命名就会变成一件很困难的事情。如果你学过 C 语言，你应该知道，为了避免名称重复，许多 C 语言程序都像下面这样取名：

```c
void glfwInit();
void glfwPollEvents();
GLFWwindow* glfwCreateWindow()
```

这些前缀很快就能让代码变得乱七八糟，特别是如果取名字的人图省事用 `strcpy`（代表 String Copy）这样的名字，使用起来就会更加困难。

为了解决这一问题，Kotlin 和 Java 发展出了**包（Package）** 的概念。包本质上就是一种前缀，比如我们在第一个插件中使用的代码：

```kotlin
org.bukkit.Bukkit.getServer().shutdown()
```

这里 `org.bukkit.Bukkit` 实际上是对象名，后面才是方法调用，并没有名为 `org` 的对象，`bukkit` 也不是某个属性的名字。

像这样的名字被称作**全名**，或者**规范化名称（Canonical Name）**，它由两部分构成：

- 一个**包名（Package Name）**，这里是 `org.bukkit`。
- 一个**基本名（Base Name）**，这里是 `Bukkit`。

包名通常都是像 `org.bukkit` 或者 `moe.skjsjhb.pd.util` 这样用英文单词和点分隔开的。有点像文件的路径，不过包名和文件夹路径不同，**包与包之间没有包含关系**，也就是说，`org.bukkit` 和 `org` 是平级，**`org.bukkit` 不是 `org` 中一个名为 `bukkit` 的包**。

*如果说文件夹是潜影盒的话，那么包就更像箱子，你无法将一个装有东西的箱子塞入另一个箱子里。*

当访问对象时，要使用全名来访问。不过全名往往很长，写起来比较麻烦：

```kotlin
org.bukkit.Bukkit.getServer()
org.bukkit.Bukkit.doThis()
org.bukkit.Bukkit.doThat()
```

Kotlin 允许我们使用全名**导入（Import）** 一个对象，此后就可以在当前文件中使用它的基本名：

```kotlin
import org.bukkit.Bukkit

// 稍后就可以这样做：
Bukkit.getServer()
```

导入对象的语法是 `import 全名`，而且必须放在文件开头。在此之后，程序的剩余部分就可以使用基本名来访问对象。

所以，第一个插件的代码，也完全可以写成这样：

```kotlin
import org.bukkit.Bukkit
import org.bukkit.plugin.java.JavaPlugin

class Main : JavaPlugin() {
    override fun onEnable() {
        Bukkit.getServer().shutdown()
    }
}
```

虽然程序的行数增加了一些，不过代码却更容易阅读了。

对了，还记得我们在开发第一个插件时所说的“`Main` 复制了 `JavaPlugin` 模板中的内容吗？”，这里所“复制”的东西，其实就是属性和方法。虽然 `Main` 是类而不是对象，不过也和对象差不多，我们在这里定义了一个类 `Main`，并从 `JavaPlugin` 中**复制所需的属性和方法**给它。至于下面的 `override fun onEnable`，也不过就是把复制过来的方法中名为 `onEnable` 的那个，**替换成我们的代码**而已。是不是很简单呢？

---

好啦，到这里，继续开发插件所需的语言知识就讲解完毕。我们没有特别关注具体的细节，只是希望大家对 Kotlin 的一些特性和用法有个大致的印象。后面的开发中还会牵涉到更多的语言知识，届时会再进行讲解。另外，你可以在 [Kotlin Playground](https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMi4wLjIxIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiZnVuIG1haW4oKSB7XG4gICAgcHJpbnRsbihcImNpYWxsbywgd29ybGRcIilcbn0ifQ==) 编写和测试一些简单的 Kotlin 代码。