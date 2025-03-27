---
sidebar_position: 6
---

# 3-6 Java 那点事

## 访问控制

有时，某些属性或者方法只应该被类自身使用，而**不应当从外部调用**：

```kotlin
class Timer {
    var time: Int = 60

    fun getTime() {
        return time
    }

    fun decrease() {
        time = time - 1
    }
}
```

我们希望使用 `Timer` 类的人只通过 `getTime` 和 `decrease` 来操作计时器，而不要直接设置 `time`。想这么做的原因有很多，比如假设稍后我们需要在倒计时的时候播放声音，就需要修改 `decrease` 方法，而那些直接访问 `timer` 的代码就不会播放声音，于是导致奇怪的 Bug。

你或许会说，“那只要大家都好好遵守规则，不去用 `timer` 不就好了？”但是，在编程方面而言，人类是不可靠的。即使你写出这样的注释：

```kotlin
class Timer {
    // 绝对不要使用这个属性！！！
    // 通过任何方式访问或者修改它绝对会出问题！！！
    // 谁动了这玩意明天就炒你鱿鱼！！！
    var time: Int = 60

    fun getTime() {
        return time
    }

    fun decrease() {
        time = time - 1
    }
}
```

但是如果有人恰好打了个瞌睡，没看到这块的注释，或者你的代码被放在库文件中，注释被编译器删除掉了，那么程序还是会出现 Bug，而要找到导致这些问题的代码又是很困难的。

为此，Kotlin（和 Java）使用了一种被称为**访问修饰符（Access Modifier）** 的东西来阻止其他人访问不该访问的东西。访问修饰符能加在 Kotlin 中几乎所有的定义之前（变量、函数、属性、方法、类、对象等等），提供四种等级的访问权限：

- `public` 公开：任何代码都可以访问。
- `protected` 保护：仅限拥有该成员的类，以及其派生类，访问该属性或函数。

   *如果一样东西不在某个类中，就不能用 `protected` 修饰它。你或许会觉得这样的话 `protected` 不能修饰类，但实际上是可以的，因为类可以嵌套，可以在一个类中定义另一个类。*

- `internal` 内部：仅限当前模块内的代码访问。

   *一个项目中可能包含多个模块，只是到目前为止，我们所有的项目都只使用一个 `main` 模块。你可以暂且理解成“`internal` 对项目外的代码不可见”，后续我们会展示多模块的项目，届时将会大量使用 `internal`。*

- `private` 私有：仅限拥有该成员的类访问（不含派生类），或者包含该变量、函数、类及对象的文件访问。

Kotlin 中的所有成员默认都是公开的（即 `public`），要修改访问权限，可以**在其定义之前添加访问修饰符**：

```kotlin
class Timer {
    private var time: Int = 60

    fun getTime() {
        return time
    }

    fun decrease() {
        time = time - 1
    }
}
```

这就会阻止下面这样的代码通过编译，除非它在 `Timer` 中：

```kotlin
val t = Timer()
t.time = 9999       // 编译错误
```

由于我们的 `Timer` 不是可继承的，因此我们用 `private` 阻止其他人访问 `time`。如果 `Timer` 是一个可继承的类，那么可以根据需要将 `timer` 设置为 `protected`，授予派生类修改该属性的权限，但仍然阻止外部代码的访问。

:::warning 君子协议

即使某个定义被标记为 `private`，也仍然是有办法访问它的，所以访问修饰符本身更多是一种提醒机制，而非保护措施。不过，要绕过访问修饰符需要相当多的工作，所以访问修饰符很大程度上避免了“写代码时打瞌睡”而引发的问题。

:::

## Getter 和 Setter

在 Java 中，访问限制经常被用来保护属性。事实上，在规范的 Java 程序设计中，都建议始终将属性设为 `private` 或 `protected`，不允许外部代码访问属性。这么做的原因有很多，下面是原因之一（摘自 [StackOverflow](https://stackoverflow.com/questions/1568091/why-use-getters-and-setters-accessors)）：

> Because 2 weeks (months, years) from now when you realize that your setter needs to do more than just set the value, you'll also realize that the property has been used directly in 238 other classes :-)
>
> 因为迟早有一天，你会需要在属性赋值的同时做些额外的事情，然后你就会发现这个属性已经在其它 238 个类中被直接赋值了（笑）。

Java 中的属性是很原始而脆弱的，如果将属性直接暴露给外部代码，外部代码可以以任何方式访问和修改属性，将来想替换读取和写入的行为就需要付出极大的代价。因此，Java 程序员通常都把属性设为私有，而另外创建两个方法，**分别用于读取属性和写入属性**，这两个方法就分别被称为 **Getter** 和 **Setter**。

```java
class Pickaxe {
    private String name = "钻石镐";

    public String getName() {
        return name;
    }

    public void setName(String s) {
        name = s;
    }
}
```

这样，将来如果想改变属性读取和写入的行为，只需要修改 Getter 和 Setter 就可以了。

但是，这么做的代价是很高昂的，重复地对各个属性编写 Getter 和 Setter 使得 Java 代码非常的臃肿，有时候甚至要通过修改编译器来自动生成一些 Getter 和 Setter，因为手动编写的工作量实在太大。

Kotlin 没有这个问题，因为 **Kotlin 的每个属性都已经内置了 Getter 和 Setter**，你可以通过下面这样的语法来改变对属性的读写行为：

```kotlin
class Pickaxe {
    var name: String = "钻石镐"
        set(v) {
            // 跳过赋值，改为使用 println 显示内容
            println("Do something")
        }
}

val pk = Pickaxe()
pk.name = "My Pickaxe"      // 将输出 Do something
pk.name                     // "钻石镐"
```

也就是说，虽然在外部看上去都是直接访问属性，但在 Kotlin 类的内部，我们可以全权控制属性访问的行为，那么像 Java 那样定义 Getter 和 Setter 就不必要了。

有鉴于此，Kotlin 鼓励程序员**直接访问属性**，而将 Getter 和 Setter 的工作隐藏在类的内部。这个设计在仅包含 Kotlin 代码的时候很不错，但 Kotlin 代码**常常与 Java 代码交互**，为了简化对 Getter 和 Setter 的使用，Kotlin 制定了这样的一条规则：

**如果某个 Java 方法是 Getter 或者 Setter，Kotlin 会对其生成一个虚拟属性，可以使用该属性的名称操作 Getter 和 Setter，即使这个属性原本不存在于 Java 类中。** 也就是说，Kotlin 把直接对属性读取和写入的能力给“拿回来”了，当然这只是形式上的，通过 Kotlin 生成的属性操作时，仍然会调用对应的 Getter 和 Setter。

这条规则的使用是有一些限制的：

- Getter 的名称必须是 `getAbc`，Setter 的名称必须是 `setAbc`，Kotlin 生成的虚拟属性名为 `abc`。
- 属性可以只有 Getter，可以二者都有，但不能只有 Setter。在只有 Setter 的情况下，Kotlin 会将它当成一个普通方法。
- 生成的属性名称不能与其它公开属性名称冲突。

也就是说，假设有这样的 Java 类：

```java
class Pickaxe {
    private String name = "钻石镐";

    public String getName() {
        return name;
    }

    public void setName(String s) {
        name = s;
    }
}
```

那么在 Kotlin 中就可以使用如下的方式访问 `name`：

```kotlin
val pk = Pickaxe()
println(pk.name)        // Kotlin 会调用 Java 中的 getName 方法，返回 "钻石镐"
pk.name = "My Pickaxe"  // Kotlin 会调用 Java 中的 setName 方法，修改属性值
```

虽然 `name` 属性看上去在 Java 类中是私有的，但由于 `Pickaxe` 中有一个 Getter `getName`，Kotlin 会**生成一个虚拟属性** `name`，当 Kotlin 代码访问 `name` 属性时，Kotlin 将会**自动调用** Java 类中的 `getName` 方法。

*当然，Kotlin 做了这种名称转换后，也不代表原来的 `getXXX` 和 `setXXX` 方法就不见了，我们还是可以沿用 Java 的风格，手动调用 Getter 和 Setter 操作属性，但是这样做就显得不太方便。*

现在我们终于可以回答 3-3 中获取配置文件时的问题了：

> Nyaci：等一下，我看过 Paper 的 Javadoc 了，`JavaPlugin` 里面没有 `config` 属性呀？我倒是找到一个叫做 `getConfig` 的方法，为什么不用它呢？

这是因为 `getConfig` 是 Java 中的一个 Getter（Bukkit 是用 Java 编写的），Kotlin 对其生成了一个 `config` 属性。如果你查看 `getConfig` 的方法签名，它是这样的：

```java
/**
 * 获取插件所对应的配置文件对象，从 `config.yml` 中读取。
 * 如果服务器上没有插件的配置文件，那么将读取插件内置的 `config.yml`。
 */
public FileConfiguration getConfig()
```

这个 Getter 返回一个 `FileConfiguration` 类的对象，也就是配置文件对象。在 Kotlin 中，它被转换成一个名为 `config` 的属性，**读取该属性就等同于调用 `getConfig` 方法**。由于 `getConfig` 是 `JavaPlugin` 的一个方法，我们的 `Main` 继承自 `JavaPlugin`，所以我们的 `Main` 也能使用 `getConfig`，那么也就同样能使用 Kotlin 生成的 `config` 属性了。

---

嘛，这一节的内容有点琐碎，我们实际上是在解决 Java 中的历史遗留问题，而为了让我们的 Kotlin 代码更好地与 Java 交互，我们就必须了解到 Java 语言本身的一些限制。总之，还是简单做个总结吧：

- 可以使用 `protected`、`internal` 和 `private` 来限制外部代码访问某个成员。
- 在 Java 中，属性通常都是私有的，通过 Getter 和 Setter 来访问。
- 通过 Kotlin 调用 Java 代码时，Getter 和 Setter 会被转换成一个虚拟属性。
- 转换而成的虚拟属性可以直接读取和写入，Kotlin 会自动调用相应的 Getter 和 Setter。

Bukkit API 中有非常多的 Getter 和 Setter，读者也许会犹豫，到底怎么将它们对应到 Kotlin 的属性，不过事实上这一点 IDEA 已经为我们考虑到了。如果你在查阅 Javadoc 的时候看到名为 `getXXX` 或者 `setXXX` 的方法，它有极大概率是一个 Getter 或 Setter，不妨在 IDEA 中**试试直接键入对应的属性名**，如果出现了对应的自动补全建议，那么就代表 Kotlin 支持将它们转换为属性使用。

例如，如果 Nyaci 已经知道要用 `getConfig` 获取配置文件，她就可以试试 `config` 这个名字，IDEA 将显示相应的建议：

![IDEA Kotlin Synthetic Properties](/img/contents/idea-kotlin-syn-prop.png)

IDEA 也会指出这个属性（`config`）是从哪里转换来的（`from getConfig()`），这可以确保我们没有调用错误的 Getter。

当然，你也可以直接照着 Bukkit 文档中的名字来，直接使用 Bukkit 文档中的名字。当你在键入 `getConfig` 方法的时候，IDEA 会自动显示对应属性的补全建议，使用它的建议即可：

![IDEA Kotlin Synthetic Properties](/img/contents/idea-kotlin-syn-prop-direct.png)