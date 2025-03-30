---
sidebar_position: 5
---

# KT-4 继承与多态

## 年代断层

假设你是 Mojang 的开发人员，并且你决定在 Minecraft 中加入苦力怕和骷髅两种生物，于是你就写出这样的代码：

```kotlin
class Creeper {
    var health: Float
    var damage: Float

    fun move(loc: Location) {
        // 移动的代码
    }

    fun explode() {
        // 爆炸的代码
    }
}

class Skeleton {
    var health: Float
    var damage: Float

    fun move(loc: Location) {
        // 移动的代码
    }

    fun shootAt(loc: Location) {
        // 射箭的代码
    }
}
```

你会注意到这两个类有很多相同之处，当代码变长的时候，这些相同的地方会更多，最终你将不得不开始复制粘贴代码。要知道，复制粘贴是绝大多数所谓“史山代码”的源头。

为了避免让代码变成难以阅读和维护的超级大难题，Java（和 Kotlin）提出了**继承（Inheritance）** 的概念。在第一个插件中我们已经这么做过了：

```kotlin
class Main : JavaPlugin() {
    // ...
}
```

我们在那时说 `Main` “复制”了 `JavaPlugin` 中的属性和方法，其实这个“复制”就是所谓的继承。现在正式地介绍一下，继承是发生在两个类之间的关系，类 A 继承 B，指的是让 A **获取 B 所拥有的全部属性和方法**。被继承的类 B 称作**基类（Base）**，而发起继承的类 A 称作**派生类（Derived）**。

类可以多级继承，也就是说 B 可以继承 C，从而 A 是 B 的派生类，而 B 是 C 的派生类，继承关系可以传递，所以 A 也可以被称作 C 的派生类。

*有些文章也将基类称作“父类”，将派生类称作“子类”，这都只是习惯问题，没有对错之分。*

在上面的生物难题中，我们可以把 `Creeper` 和 `Skeleton` **共同的部分抽取出来**，称作 `Monster`，然后分别让 `Creeper` 和 `Skeleton` “复制”它的内容：

```kotlin
open class Monster {
    var health: Float
    var damage: Float

    fun move(loc: Location) {
        // 移动的代码
    }
}

class Creeper : Monster() {
    // 这些就不再需要了
    // var health: Float
    // var damage: Float

    // fun move(loc: Location) {
    //     // 移动的代码
    // }

    fun explode() {
        // 爆炸的代码
    }
}

class Skeleton : Monster() {
    // 这些也不再需要了
    // var health: Float
    // var damage: Float

    // fun move(loc: Location) {
    //     // 移动的代码
    // }

    fun shootAt(loc: Location) {
        // 射箭的代码
    }
}

// 但我们仍然可以使用基类的方法
val c = Creeper()
c.move(...)
```

看看，代码一下就少了不少！被继承的类（基类）需要在 `class` 前加上 `open`，代表“允许继承”，因为 Kotlin 中的类默认是不可继承的，除非明确注明。

不过 `Monster()` 最后面的 `()` 是什么？这是**对基类构造函数的调用**。派生类总是会调用基类的构造函数（如果你忘了，Kotlin 编译器会“友好地”使用编译错误提醒你）。如果基类的构造函数有参数，派生类的构造函数必须负责提供它们。

:::info 不完全是复制

读者可能会认为，既然继承是“复制”，为什么还和基类的构造函数牵扯上关系了呢？这是因为，虽然继承的性质和复制很相似，但实际上 Kotlin 是先构造一个基类的对象，再使用派生类的构造函数进一步“加工”的。如果不向基类构造函数提供参数，第一个对象就无法构造，整个对象也就无法创建了。

:::

类继承还有一个很有用的特性，即可以将派生类的对象**当作基类对象**使用：

```kotlin
fun goto(m: Monster, loc: Location) {
    m.move(loc)
}

val c = Creeper()
val s = Skeleton()
val loc = Location(100, 64, 100)

goto(c, loc)    // c 的类型是 Creeper，但 Creeper 继承自 Monster，所以 c 可以被当作 Monster 使用
goto(s, loc)    // 原理同上
```

虽然 `c` 和 `s` 分别是各自派生类的对象，但由于它们继承自 `Monster`，Kotlin 认为“它们的内容至少与 `Monster` 一样丰富”，于是就允许它们作为 `goto` 方法的参数。由于 `goto` 对于参数 `m` 的使用**仅限于 `Monster` 所定义的范围**，而 `Creeper` 和 `Skeleton` 都**一定比这个范围大**，所以这么调用虽然看上去有些古怪，但却不会引发任何问题。

如果没有类继承，我们将不得不编写两个类似 `goto` 的函数，分别用于 `Creeper` 和 `Skeleton`：

```kotlin
fun creeperGoto(m: Creeper, loc: Location) {
    m.move(loc)
}

fun skeletonGoto(m: Skeleton, loc: Location) {
    m.move(loc)
}
```

因为在没有继承共同类的情况下，虽然 `Creeper` 和 `Skeleton` 都有 `move` 方法，但对于 Kotlin 编译器而言，要分析出这一点还是太难了，所以我们无法利用这种共通性，只能定义两个函数，这可太不方便了。

:::info 不画蛇添足

你或许会想，是不是设计 Kotlin 编译器的人偷懒而不去支持这种功能？虽然我们不能 100% 保证设计师没有过偷懒的心思，但主要原因确实不是这个。问题在于，大多数时候 Java（和 Kotlin）方法的内容无法在编译时获知：编译器拿到的常常只是一部分的源代码，另一部分则是只包含方法头的库文件（类似于 C 语言中的 `.h` 头文件）。编译器无法得知某个方法具体用到了参数的哪些成员，也就无法支持我们设想的那种功能。

:::

## 假想对冲

派生类在继承基类的时候，可以选择修改一部分属性和方法，这件事情我们同样也已经做过了：

```kotlin
class Main : JavaPlugin() {
    override fun onEnable() {
        // 替换掉 JavaPlugin 中 onEnable 的行为
    }
}
```

这叫做**重写（Override）**，指的是派生类替换基类方法的行为。重写并不能无条件地发生，如果要让一个方法可被重写，**基类必须将此方法标记为 `open`**，和类继承一样，这是为了防止不该被重写的方法意外被修改。

重写有一个好玩而且重要的用途，请看下面的例子：

```kotlin
open class Monster {
    open fun move(loc: Location) {
        // 走到指定位置
    }
}

class Phantom : Monster() {
    override fun move(loc: Location) {
        // 飞行到指定位置
    }
}

class Fish : Monster() {
    override fun move(loc: Location) {
        // 游到指定位置
    }
}

class HIM : Monster() {
    override fun move(loc: Location) {
        // 传送到指定位置
    }
}

fun goto(m: Monster, loc: Location) {
    m.move(loc)
}

val loc = Location(100, 64, 100)

goto(Phantom(), loc)
goto(Fish(), loc)
goto(HIM(), loc)
```

如果我们给 `goto` 方法传递不同类型的参数（尽管它们都继承自 `Monster`），那么 `goto` 当中的 `m.move` 会调用哪个 `move` 方法呢？答案是以下两个之一：

- 全都是 `Monster.move`，因为参数 `m` 的类型是 `Monster`。
- 是各自真实类型的 `move`（`Phantom.move`、`Fish.move`、`HIM.move`），因为对象重写了对应的方法。

正确答案是第二个，你猜对了吗？如果感到很费解，你可以这么理解：**重写是永久性的**，对象的方法一旦被重写，就会永远带着重写后的方法，即便是被当作其它类型传递也是如此。

所以，即使一个对象“看上去”是类型 A，但它的**真实类型可能是 A 的某个派生类**。如果你调用它的某个方法，**实际执行的代码可能不是 A 中原先定义的内容**。这种允许使用**同一个类型**的对象，调用多种**实际代码不同**的方法的机制，叫做**多态（Polymorphism）**。

多态的应用非常广泛，例如 Bukkit 在加载插件时，大致有类似下面这样的代码：

```kotlin
allPlugins.forEach { plugin ->
    plugin.onEnable()   // 调用各插件的 onEnable 方法
}
```

Bukkit 不关心 `onEnable` 的实际代码是什么，这可以由插件自定义，它只需要执行 `onEnable` 方法就可以了。即使在 Bukkit 看来，所有的插件都是 `JavaPlugin`，但它也知道，在这些自称是 `JavaPlugin` 的对象背后，一定有着比 `JavaPlugin` 中的东西更丰富的内容。不过那又与它有什么关系呢？它只是一个默默无闻的插件加载器罢了。

如果没有多态，要做到同样的事情就会非常困难。

---

这一节真是长！虽然篇幅上来看不算长篇大论，但是由于介绍了面向对象中的核心概念，理解起来的难度是很大的。我们来简要总结一下：

- 继承用来提取和描述两个类的共通性。
- 派生类可以通过继承来“复制”基类的内容，继承关系可以有多级。
- 派生类必须调用基类构造函数。
- 派生类可以重写基类的属性和方法。
- 派生类对象可以当作基类对象使用。
- 某个对象看上去的类型不一定是它的实际类型，调用的某个方法也不一定是原始版本。
- 通过多态，调用者无需修改代码，就可以调用多种不同的方法。
- 通过多态，派生类可以改变一些方法被调用时的行为。
- 若要让类能被继承，需要添加 `open`，若要让方法能被重写，也需要添加 `open`。

也许读者关于多态的应用还有些疑惑或者迷茫，这都是非常正常的现象，不要太过担心。“纸上得来终觉浅，绝知此事要躬行”，在编写插件的旅途中我们还会碰到很多多态的例子，我们有时是调用者，有时是派生类，我们有时利用多态来做成一些事情，有时却又使用多态来阻止一些事情。相信在今后的项目中，通过阅读和编写代码，大家能对多态以及其它面向对象的概念有进一步的了解。