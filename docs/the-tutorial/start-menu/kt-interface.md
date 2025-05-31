---
sidebar_position: 3
---

# KT-5 抽象类与接口

## 从多态到抽象方法

还记得我们前面提到的**多态**吗？类型看上去是 `A` 的对象，其实际类型可能是 `A` 的派生类，所以调用到的方法可能不是 `A` 中的原始版本。

多态经常被用于**让派生类自定义一些行为**，请看下面的代码：

```kotlin
open class JavaPlugin {
    open fun onEnable() {
        // 希望派生类重写该方法
    }
}

class MyPlugin : JavaPlugin() {
    override fun onEnable() {
        saveDefaultConfig()
    }
}

class YourPlugin : JavaPlugin() {
    override fun onEnable() {
        server.shutdown()
    }
}

fun runPlugin(p: JavaPlugin) {
    p.onEnable()
}

runPlugin(MyPlugin())
runPlugin(YourPlugin())
```

我们“刻意地”在 `JavaPlugin` 当中留出了一个 `onEnable` 方法，目的就是要让各个插件类重写它，这样我们就可以通过多态，像 `runPlugin` 方法中那样，在完全不知道具体插件类信息的情况下，正确地执行各个插件的初始化代码。换而言之，我们在基类中留出了一个“后门”，允许派生类向里面“注入”代码，然后我们稍后再来使用这些代码。

在上面这个例子里，我们的插件即使不重写 `onEnable` 方法，程序也是能正常运行的，插件只是什么都不做而已，只是一般而言为了实现功能，都要重写 `onEnable` 方法。但是，有些时候，基类的方法是**必须被重写**的，请看下面的例子：

```kotlin
open class Monster {
    open fun getHealth(): Int {
        // 希望派生类重写该方法
    }
}

class SuperCreeper : Monster() {
    override fun getHealth(): Int {
        return 9999
    }
}

class UltraZombie : Monster() {
    override fun getHealth(): Int {
        return 9999999
    }
}

```

由于 `Monster` 描述的是所有怪物的共通特征，因此它无法决定 `getHealth` 应该返回什么值，这个方法**必须由它的派生类重写**才有意义。你或许会说，返回一个 `-1` 之类的值不就好了？那是因为也许对 `Int` 而言，构造一个默认值很容易，但如果方法的返回值是 `Player` 呢？要想构造一个 `Player` 就很困难了！而且，这么做带来三个问题：

- 即使返回默认值，默认值也是**没有意义**的 —— 只有派生类知道自己的血量应当是多少，如果不重写这个方法，就与设计不符。
- 构造和返回默认值会带来不必要的额外**性能开销**。
- 和先前在访问修饰符那里提到的一样，**人是不可靠的**，编写代码的人或许会忘记重写本来应该重写的方法。

因此，Java（和 Kotlin）使用一种叫做**抽象类（Abstract Class）** 的东西来解决这些问题。

抽象类，就是指含有**抽象方法（Abstract Method）** 或**抽象属性（Abstract Property）** 的类，而所谓抽象方法和抽象属性，就是指**没有方法体**（对于抽象属性而言是没有 Getter 和 Setter）的方法和属性。要标记一个类或成员是抽象的，就要使用 `abstract` 来修饰它。

抽象类是**不完整的类**，你可以把它理解成设计师做了一半的蓝图：

```kotlin
abstract class Monster {                    // Monster 是抽象的，是因为……
    abstract fun getHealth(): Int           // ……这个 getHealth 方法是抽象的
}

class Zombie : Monster() {                  // 因为 Zombie 不是抽象的……
    override fun getHealth(): Int {         // ……所以必须重写抽象方法 getHealth
        return 20
    }
}

val m = Monster()   // 不行！Monster 不够完整
val z = Zombie()    // 可以运行，因为 Zombie 不是抽象类
```

在 `class Monster` 前加上 `abstract`，就将它变为一个抽象类，同样的，在 `fun getHealth` 前加 `abstract`，就将它变为一个抽象方法。由于抽象类不够完整，因此**不能通过调用它的构造函数来创建对象**。

:::info

不能调用构造函数**不代表抽象类没有构造函数**，抽象类仍然可以像普通类一样用构造函数来初始化属性，派生类也仍然**需要调用抽象类的构造函数**，它们只是不能被直接用来创建对象。

:::

在添加了这些 `abstract` 后，对 `Monster` 的继承就会发生一些微妙的变化，任何一个继承 `Monster` 的类都必须**满足以下条件之一**：

- 重写所有抽象方法与属性。
- 将自身标记为 `abstract`。

这其实很好理解，派生类实际上就是在基类的“蓝图”上做加法和修改，当派生类“填补”了基类中所有的空缺（即 `abstract` 的成员）后，派生类就终于摆脱了抽象类的行列，而得以成为一个普通的类，否则就是“先帝创业未半”，只能继续留给它的派生类来完成。

*如果类或成员是 `abstract` 的，那么它们也将自动成为 `open` 的。*

对抽象方法的重写，由于是把没有内容的东西变成了有内容的东西，因此也被称作**实现（Implement）**。

## 接口

接口是一种特殊的抽象类，在 Kotlin 中，接口的主要特点有三个：

- 一个派生类只能继承一个基类，但可以“继承”**多个**接口。
- 在接口中定义的方法**默认是抽象的**，除非提供方法体。
- 接口**无法记忆状态**。

<details>
<summary>你是职业选手吗？</summary>

与 Java（8及以前）不同，Kotlin 中的接口可以正常定义和使用非抽象方法。

</details>

我们分别来解释这几个概念。在 Java 和 Kotlin 中，**一个派生类最多只能继承一个基类**，这主要是从 C++ 多重继承引发的许多问题中吸取的教训 —— 只要没有多重继承，一些诸如 [钻石难题](https://zh.wikipedia.org/wiki/%E8%99%9A%E7%BB%A7%E6%89%BF) 的问题一开始就不会存在。但接口不同，一个类可以“继承”任意多的接口，对接口的“继承”被称作**实现（Implement）**。

接口经常被用来描述对象应当具有的一些“特性”，或者说描述对象至少应该具备哪些方法。请看下面的例子：

```kotlin
interface Flyable {
    fun fly()   // 默认是抽象的
}

interface Drinkable {
    fun drink()
}

class Magic : Flyable, Drinkable {
    override fun fly() {
        // 做些什么
    }

    override fun drink() {
        // 做些什么
    }
}

val a: Flyable = Magic()    // 赋值成功，因为 Magic 实现 Flyable，它的内容至少与 Flyable 一样多
val b: Drinkable = Magic()  // 同理，赋值成功
```

在上面的例子里，尽管 `Magic` 没从接口 `Flyable` 和 `Drinkable` 继承到什么有用的东西（它们的方法全是抽象的），但是当 `Magic` 实现了 `Flyable`，**任何接受 `Flyable` 的地方也都会接受 `Magic`**！这就和各种资格证一样，要单独考察某个类是不是具备相应的能力是很难的，但如果它掏出一张资格证（在这里，`Magic` 自豪地说：“我实现了 `Flyable`！”），那么就可以立刻证明它的资质（具有 `fly` 方法）。

*所以，继承关系从来都不是派生类单方面从基类获取信息，派生类负责添加内容，而基类（和接口）负责保证它的通用性。*

像下面这样的用法，仅通过抽象类是无法做到的：

```kotlin
class Superman : Flyable, Healable, Teleportable, Speakable { // Superman 类非常强大，实现了多种接口！
    // 具体的实现内容
}

fun flyHigh(fb: Flyable) {
    fb.fly()
}

fun healALot(h: Healable) {
    h.heal(9999)
}

fun teleportTo(tp: Teleportable) {
    tp.teleport(0, 100, 0)
}

fun sayCiallo(spk: Speakable) {
    spk.say("ciallo, world")
}

val sp = Superman()
flyHigh(sp)     // flyHigh 接受 Flyable，而 Superman 实现 Flyable，所以 flyHigh 接受 Superman！
healALot(sp)    // 以下同理
teleportTo(sp)
sayCiallo(sp)
```

在 Bukkit（和许多其它程序）中，各种方法经常使用接口，以避免对参数对象**施加超出方法自身所需之外的要求**。例如，如果某个方法向指定的对象发送消息，那么或许用 `Audience`（能接收消息的对象）就比用 `Player` 好，因为如果某个不是 `Player` 的对象也想要接收消息，那么它只需要实现 `Audience` 就行，但如果使用 `Player`，那么像这样的扩展就做不到了，程序的灵活性便会下降。当我们设计程序时，最好也这么做，即总是反复问自己：**“在这里用基类可以吗？基类的基类呢？”**

*当然，对象的特性也不是分拆得越细节越好，那样会使得程序中充斥着大量无用的接口，并且会使继承关系变得复杂。至于具体如何将功能精准分拆为接口，这需要对程序功能的充分理解和许多面向对象编程的经验才能做到。*

那，什么叫做“接口无法记忆状态”呢？这是 Kotlin 为了避免多接口引发的一些问题，而对接口设置的额外限制。所谓没有状态，基本上也可以理解为**不能持有带有值的属性**：

- 可以定义属性，但不初始化，使它成为一个抽象属性。
- 可以定义属性的 Getter 和 Setter，它们也可以引用接口中已定义的其它属性。

请看下面的代码：

```kotlin
interface Player {
    val name: String                // OK，派生类将负责初始化它
    val name1: String = "Player"    // 不行！

    val loudName: String
        get() {                     // OK，可以对属性定义 Getter 和 Setter
            return name.uppercase()
        }
}
```

在插件开发中，我们对于接口的使用都仅限于方法，因此我们可以简单理解成“接口不能具备属性”，但读者应当明白，这个说法不够严谨，因为接口是**可以持有属性的**，只是它们**不能用来存储任何东西**。

由于接口没有状态，因此它们也没有构造函数。同样，即使一个接口不含任何抽象方法或属性，也不能直接创建它的对象。

---

抽象类和接口是面向对象编程中相当重要的概念，它们让继承关系不再是单方面的“复制”，而要求派生类实现基类未完成的工作。当派生类完成了这些工作后，基类（无论是抽象类还是接口）将负责保证它的通用性。简要总结一下：

- 抽象类就是指包含抽象方法或者抽象属性的类。
- 抽象方法没有方法体，抽象属性没有值、Getter 或 Setter。
- 派生类若不是抽象类，则必须通过重写实现基类中的抽象方法。
- 接口基本上等于无法持有状态的抽象类。
- 不能继承多个类，但可以实现多个接口。
- 接口中的方法和属性默认是抽象的。
- 接口没有构造函数。
- 接口常用来描述对象的特征和功能。当对象的类实现了某个接口后，任何使用该接口的地方也会接受该对象。