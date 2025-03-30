---
sidebar_position: 7
---

# KT-6 Kotlin 与函数

Kotlin 与 Java 的兼容性堪称一绝，强大的类型推断能力也可令人称道，但对笔者而言，Kotlin 最吸引人的地方是它令函数式编程变得极为简单方便。在我们继续讲解如何处理命令之前，先来了解 Kotlin 函数式编程的冰山一角，稍后将会用到这部分内容。

## 传递一些操作

你应该已经对函数（属于对象的函数称为方法）非常熟悉了：

```kotlin
fun funName(arg: ArgType): ReturnType {
    return retValue
}
```

当然，函数也可以在其它函数内部定义：

```kotlin
fun foo() {
    fun bar() = 42
    println(bar())
}
```

有趣的事情在于，函数除了可以通过调用**直接使用**，也可以把它**赋给一个变量**（参数、属性等也是变量），以便稍后使用：

```kotlin
val bar = fun(): Unit {
    println("ciallo, world")
}
```

通过去掉函数名得到的函数被称作**匿名函数**，它们可以赋给变量以便稍后使用。

函数作为变量传递这个特性，经常被用来**传递“一系列操作”**：

```kotlin
fun sayCialloTo(
    receiver: (String) -> Unit
): Unit {
    receiver("ciallo, world")
}

val printOutput = fun(s: String): Unit { println(s) }

sayCialloTo(printOutput)
```

`receiver` 虽然类型看上去有点奇怪，不过像 `(参数类型, 参数类型, ...) -> 返回值类型` 这样的写法就是在**描述一个函数的类型**，括号内是以逗号分隔的参数类型（注意不包含参数名），`->` 后则是返回值类型。也就是说，**`receiver` 是一个函数**。既然是函数，那么就可以像上面那样，直接加上 `()` 进行调用。

“传递一系列操作”这个功能，特别适合用于将代码拆分开。在上面的例子里：

- `sayCialloTo` **只需要考虑输出什么就可以了**，`"ciallo, world"` 将被怎么使用是 `receiver` 的事情。
- `printOutput` **只需要考虑怎么输出就可以了**，`s: String` 参数的来源是使用它时考虑的事情。
- 最后一行要考虑的就很多了，通过将 `printOutput` 作为 `receiver` 参数传递给 `sayCialloTo`，它完成两部分功能的**组合**。

这样，在未来，`sayCialloTo` 和 `printOutput` 就能分别独立地修改而不影响对方，程序就变得很容易维护。

## 这个入是桂

像上面那样通过 `fun(参数: 类型, ...): 返回值类型 { 代码 }` 这样的方式定义匿名函数还是太麻烦了，大家都知道，软件工程师是一种非常喜欢偷懒的生物，所以 Kotlin 的设计师提出了 **λ 函数（Lambda Function）** 的概念。

*这个字不念“入”，它是一个拉丁字母，发音是 /ˈlæm.də/。不过尽管 Lambda 函数不叫入函数，但它非常厉害，强度和外挂差不多，姑且就叫它“桂”吧（笑）。*

一个匿名函数可以如下地对应到一个 Lambda 函数：

```kotlin
fun(a: Int, b: Int) -> Int {
    return a + b
}

// 等价于

{ a: Int, b: Int ->
    a + b
}
```

也就是 `{ 参数列表 -> 代码 }`，参数列表周围的 `()` 被去掉了。另外，Lambda 不使用 `return`，而是将**代码中最后一个表达式**作为 Lambda 的返回值（和 `if` 很像）。如果代码部分什么都没有，或者最后一行不是表达式，那么它返回 `Unit`。

像上面这样在 Lambda 内设置类型实在是太麻烦了，由于 Lambda 通常都赋给变量，因此可以**对变量定义类型**，而让 Kotlin 推测参数类型：

```kotlin
val myLambda: (Int, Int) -> Int = { a, b -> a + b }
```

在这种情况下，Lambda 中的**参数声明是可选的**，也就是说，如果用不到参数 `a` 和 `b`，就可以把 `a, b` 连同 `->` 一并去掉：

```kotlin
val myLambda: (Int, Int) -> Int = { 42 }

// 上面的代码基本等价于

fun myLambda(a: Int, b: Int) {
    return 42
}
```

当然，由于参数也是一种变量，因此 Kotlin 也能通过参数类型推测 Lambda 的类型。我们可以将上面关于 `ciallo, world` 的代码如下改写：

```kotlin
fun sayCialloTo(receiver: (String) -> Unit): Unit {
    receiver("ciallo, world")
}

sayCialloTo({ s -> println(s) })    // { ... } 的类型应当是 (String) -> Unit
                                    // 所以，s 的类型应当是 String
```

我们给 `sayCialloTo` 传递了一个 Lambda，Kotlin 通过 `receiver` 的类型得知参数 `s` 的类型是 `String`，因此就无需在 Lambda 中声明任何类型，是不是很方便呢？

要是只是到这里，Lambda 函数也不会那么有用了。Kotlin 是一门很注重**编辑效率**的语言，它希望最大程度减少**插入括号**、**移动光标**、**换行前插入分号**这类无用的操作，因此在 Kotlin 中，有这样一条规则：

如果某个函数调用的**最后一个参数**是 Lambda，则可以将它挪到 `()` 外。

也就是说，下面的代码是等价的：

```kotlin
sayCialloTo({ s -> println(s) })

sayCialloTo() { s -> println(s) }
```

然后 Kotlin 规定，如果以这种方式简化后的调用，`()` 中没有其它参数，那么就可以**省略参数括号**：

```kotlin
sayCialloTo { s -> println(s) }
```

最后，Kotlin 发现大多数 Lambda 都只有一个参数，因此它又规定，如果 Lambda 内没有定义任何参数，那么**第一个参数将默认命名为 `it`**：

```kotlin
sayCialloTo { println(it) } // it 就是第一个参数，类型为 String
```

实际使用起来你就会发现，Lambda 的这些用法实在是太方便了，但这也并非 Lambda 强大的全部原因，Kotlin 中有一系列因 Lambda 而强大的函数，在介绍它们之前，我们必须先谈论**扩展函数**的概念。 

## 强制攻入技术

有时候我们希望利用对象已有的方法和属性来**构造些新东西**：

```kotlin
fun intToHex(n: Int): String {
    return "0x" + n.toString(16)     // 转换为 16 进制，并在前方添加 0x 符号
}
```

像上面这样的写法，我们必须创建一个新的函数，一旦像这样的函数多了起来，我们就会重新陷入“找到该用哪个函数”的问题 —— 虽然这正是面向对象编程意图解决的。我们希望能把 `intToHex` 方法放在 `Int` 类当中，这样就可以像下面这样使用方法：

```kotlin
val a = 32
a.toHex()   // 0x20
```

可惜的是，这种想法是做不到的，因为要向 `Int` 添加方法必须**修改类的定义**，但在 Kotlin（和 Java）中，类一旦定义就不可修改。

Kotlin 提供了**扩展函数（Extension Function）** 来实现相同的功能。简单来说，扩展函数可以“附加”在某个类上，扩展类的功能。它虽然不直接修改类的代码，但是允许我们像调用方法一样调用它，**就像是在类中增添方法一样**。

扩展函数的定义像下面这样：

```kotlin
fun Int.toHex(): String {
    return "0x" + toString(16)
}
```

我们仅仅是把函数名换成了 `类名.扩展函数名`，其它什么地方都没有变，这个函数就成为一个扩展函数！扩展函数在使用时将被**视作类所拥有的方法**，也就是说：

- 可以通过 `对象.扩展函数名(参数, ...)` 直接调用。
- 可以访问对象拥有的公开属性和方法（例如上面的 `toString`）。
- 方法也可以调用扩展函数。

不过与之相对的，扩展函数相比方法也有些限制：

- 使用扩展函数必须单独导入它（尽管这件事通常会由 IDEA 来做）。
- 扩展函数**不支持多态**，也就是说，如果一个值的声明类型是 `A`，那么调用 `A.扩展函数名` 就只会调用到为 `A` 定义的扩展函数，哪怕这个值的实际类型是 A 的子类。

*不支持多态恐怕是扩展函数最大的缺点。*

扩展函数经常被用来临时地为对象增添一些功能，例如，以前我们每次向玩家发送消息，都需要构造一个 `Component`，再发送出去，这可以用扩展函数来简化：

```kotlin
fun Player.sendTextMessage(m: String): Unit {
    val c = Component.text(m)
    sendMessage(c)
}

ev.player.sendTextMessage("ciallo, world")
```

通常而言这种级别的简化并没有实际的意义，不过要是 `sendTextMessage` 做的事情再多些，扩展函数就会变得非常方便。

## 作用域函数

Kotlin 为所有的对象都定义了下面四个非常有用的扩展函数：`let`、`run`、`apply`、`also`，请看下面的代码：

```kotlin
ev.player.let {
    println(it.name)
    it.sendMessage("ciallo")
    it.kick("信号不好")
    42
}   // 返回 42

ev.player.run {
    println(name)
    sendMessage("ciallo")
    kick("信号不好")
    42
}   // 返回 42

ev.player.apply {
    println(name)
    sendMessage("ciallo")
    kick("信号不好")
    42
}.ban()     // 返回先前调用 apply 的对象

ev.player.also {
    println(it.name)
    it.sendMessage("ciallo")
    it.kick("信号不好")
    42
}.ban()     // 返回先前调用 also 的对象
```

这四个扩展函数都接受一个 Lambda，允许你在这个 Lambda 中**对指定的对象做一些操作**，它们的区别只在于你如何访问这个对象：

- `let` 和 `also`：对象作为 Lambda 的第一个**参数**传递（从而可以用 `it` 访问）。
- `run` 和 `apply`：对象作为 `this` 传递，也就是说可以在 Lambda 中直接**使用对象的属性和方法**。

……以及函数自身的返回值：

- `let` 和 `run`：函数返回值是 Lambda 的返回值（即最后一个表达式）。
- `apply` 和 `also`：函数返回值是指定的对象（Lambda 的返回值被忽略）。

这些函数的工作就是**把提供的对象“抓住”**，再以各种方式**传递**给 Lambda 当中代码的作用域，它们也是因此得名。

作用域函数最有用的功能是**删除中间变量**，也就是说，如果没有它们，就必须写这样的代码：

```kotlin
val p = createNewPlayer()
p.setName("aaa")
p.sendMessage("ciallo")
p.kick("信号不好")
println(p.name)
```

而如果在这种情况中使用 `run`，就不需要使用中间变量 `p`：

```kotlin
createNewPlayer().run {
    setName("aaa")
    sendMessage("ciallo")
    kick("信号不好")
    println(name)
}
```

下面是另一个例子，Kotlin 程序员们最津津乐道的“不使用中间变量交换两个数”：

```kotlin
var a = 1
var b = 2
a = b.also { b = a }
```

这段代码的执行顺序是这样的：

- `b.also` 扩展函数被调用，`also` 记录下变量 `b` 当前指代的对象（在这里是数字 `2`）。
- 扩展函数内的代码被执行，`b` 指代的对象被改为 `a` 指代的对象（即数字 `1`）。
- `b.also` 扩展函数返回，返回值是 `also` 先前记录的值，即数字 `2`。
- 执行赋值，`a` 的值被修改为 `2`。

代码的秘诀就是 `also` 能够“记住”一开始 `b` 所指代的东西，即使在 `{}` 内改变了 `b`，这个记录也不会变化，稍后可以通过 `also` 的返回值重新取回这个值。

作用域函数为 Kotlin 增加了极大的灵活性，结合扩展函数，使得 Java 中许多常见的设计模式（建造模式、装饰器模式等）变得更容易实现了。这有时也不得不让工程师们思考：究竟是让语言尽可能简单，把各种范式的实现交给程序员，还是将实现这些范式所需的工具都加入语言中，尽管语言可能更复杂，编译起来也更慢？这个问题也许没有确切的答案。
