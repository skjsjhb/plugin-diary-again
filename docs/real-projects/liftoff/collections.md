---
sidebar_position: 5
---

# KT-9 Kotlin 集合类（上）

在有了泛型之后，我们终于可以开始介绍它的一个重要衍生产物 —— 集合类。所谓集合类，指的其实不是 Kotlin 中的某个具体的类，而是一系列用来**存储批量对象**的类，这些都是设计 Kotlin（和 Java）的人为我们编写好的，可以用在程序中的多个地方。

集合类中通常包含着许多对象，当我们谈论集合类中的对象时，通常把它们称作**元素（Element）**。由于元素的类型可以自定义，因此这些集合类都是**泛型类**，它们通常接受一个参数，表示“装着的元素是什么类型”。

*程序设计上的集合与数学意义上的集合不同，根据需要，其中可能会有重复的元素，精通数学的读者请暂且忍耐一下吧（笑）。*

## 数组（Array）

<details>
<summary>你是职业选手吗？</summary>

严格来说，Kotlin 中的 `Array<T>` 对应的是 Java 中的 `T[]` 这样一个基础类型，不能算作是 JCF 的一部分，但由于数组本身是如此简单而又重要，因此我们就在这里一并介绍了。

</details>

```kotlin
val arr = arrayOf(1, 2, 4, 16, 32)
```

*不要问我为什么没有 8，或许是 Nyaci 不小心删掉了，嗯，就是这样。*

数组是最简单的集合类，在 Kotlin 中对应的类型是 `Array<T>`。它的功能和 Minecraft 中的物品栏非常相似 —— 表示内存中一系列（逻辑上）连续的对象。数组的**大小是固定的**，在创建后就不能修改。

要访问数组中的某个元素，只需要提供它的“位置”，术语称作**索引（Index）**：

```kotlin
println(arr[1])     // 2
arr[1] = 3          // 数组就变成 1, 3, 4, 16, 32
```

等一下，第一个元素不应该是 `1` 吗？哈，在大多数编程语言中，数组的**索引从 `0` 开始**，也就是说，第一个元素的索引是 `0`，第二个是 `1`。将这个东西称作“位置”有点误导性，应该说它是“与第一个元素之间的距离”（笑）。

和物品栏一样，数组的功能非常有限，我们只能够读取或改变某个“格子”（即索引）中的内容，如果想要删除某个元素呢？在 Minecraft 中你会把对应的物品丢出物品栏，对应的格子就变成空的。在 Kotlin 中，做法也是类似的 —— 把对应索引上的元素设为 `null`。

```kotlin
val arr: Array<Int?> = arrayOf(1, 2, 4, 16, 32)     // Int? 允许数组中包含 null
arr[1] = null   // 数组变为 1, null, 4, 16, 32
```

*Kotlin 默认不允许元素为 `null`，如果想要这么做，就得手动指定一下。*

如果稍后向往数组中加入点什么，就需要找到一个 `null` 值，并将要加入的对象放在那里。如果数组已经满了呢？那就麻烦了！

除此之外，如果想要从数组中删除元素，又不想在那里留下“空格”，那就不得不把后面的元素全部往前搬一位。如果你在 Minecraft 中手动整理过物品栏，你就会知道这是一件多么痛苦的事情。

数组的功能实在太过贫乏，以至于除了用来表示“一系列值”之外，其它的用途非常有限。然而在实际应用中，“在一列值中进行插入或删除”是个非常常见的功能，我们需要一个更高级的集合类，这就是……

## 列表（List）

```kotlin
val roList = listOf(1, 2, 3, 4, 5)
```

列表是数组的改进版本，它和数组一样，用来表示一系列值，我们同样可以使用索引来访问其中的元素：

```kotlin
println(roList[1])  // 2
roList[1] = 3   // 不行！List 是只读的
```

### 只读与可写

上面这样的列表是不能通过 `roList[1] = 2` 来写入值的。这是因为在 Kotlin 中，列表有两个对应的类，分别是 `List<T>` 和 `MutableList<T>`。前者是只读的，后者是可写（Mutable）的，就像 `val` 和 `var` 那样。

由 `listOf` 创建的列表是 `List` 类型，如果想要创建一个可读写的列表，需要使用 `mutableListOf`：

```kotlin
val rwList = mutableListOf(1, 2, 3, 4, 5)
rwList[1] = 3
```

:::info 可变的与不变的

Kotlin 的设计哲学之一就是“不包含不必要的特性”。如果某项数据是只读的，那么它就有很多优秀的性质，比如可以用在多个线程中，能保持类型参数的继承关系等。当然，也能防止不该被改变的东西被意外改变。除了 `val` 与 `var` 之外，Kotlin 中的许多内置类也像 `List` 这样，拥有只读和可写的两个版本。

话虽如此，但由于许多 Kotlin 工程师以前（或者现在）同时也是 Java 工程师，而 Java 中没有 `MutableList` 这样的概念 —— Java 中的 `List` 就是 Kotlin 中的 `MutableList`，因此当我们谈论集合类时，就不对可读写性做区分。然而，各位读者需要知道，当我们说“删除某个值”这样需要修改集合类的操作时，我们**指的就是它们的可写版本**。

:::

### 删除元素

除了能像数组那样对指定位置上的元素进行修改之外，我们还可以从列表中删除一个元素，只需要使用 `remove` 或 `removeAt` 方法：

```kotlin
rwList.remove(1)    // 2, 3, 4, 5
rwList.removeAt(1)  // 1, 3, 4, 5
```

`remove` 删除指定**值**的元素，而 `removeAt` 删除指定**位置**上的元素。与数组不同，这两个方法在删除元素的同时，也会自动把后面的元素往前挪，补上空缺的位置，使得列表始终是**一个连续的整体**。这样，稍后我们使用列表时，就不用担心其中充斥着乱七八糟的 `null`。

*当然，取决于列表内部的实现，实际所做的操作可能有所不同，不过从逻辑上来说，我们可以认为“后面的元素补上了空位”。*

:::tip 术语库

在程序设计中，**逻辑上（Logically）** 是与**物理上（Physically）** 相对应的概念，“逻辑上”是抽象而理想化的，而“物理上”则是更贴近实际的。换句话说，逻辑上更关注某样东西**看上去是怎样的**，而物理上更关注它**实际上是怎样的**。

在上面的例子中，一个列表可能在物理上（内存中）不是连续的（例如 `1, null, 3, 4, 5`），这取决于实现 `MutableList` 的类内部的实现方法（`MutableList` 是一个接口）。但如果它能在访问值时自动避开 `null`，那么对于使用者而言，“看上去”就像是连续的（`1, 3, 4, 5`），我们就说它逻辑上是连续的。

:::

### 添加元素

既然可以删除元素，我们也可以向列表中添加元素，对应的方法是 `add`：

```kotlin
rwList.add(1)       // 在末尾插入 1，列表变为 1, 2, 3, 4, 5, 1
rwList.add(0, 1)    // 在 0 索引插入 1，列表变为 1, 1, 2, 3, 4, 5
```

`add` 有许多不同的版本，最常用的版本仅包含一个参数，代表**在列表末尾增加**，而它带有两个参数的变种支持**在指定位置添加**。Kotlin 会自动挪动列表中的元素，如果有必要，它还会自动扩展列表的大小。

`add` 还有一些功能相近的方法，比如 `addLast`、`addFirst` 和 `addAll`，这些无非也就是各种类型的 `add`，在此不再赘述。大家可以在 [Kotlin 标准库文档](https://kotlinlang.org/api/core/kotlin-stdlib/) 中搜索相应的方法，了解它们的功能。

### 查找元素

`List` 提供了方便的 `contains` 方法来确认某个元素是否在列表中：

```kotlin
roList.contains(1)  // true
roList.contains(8)  // false
```

如果我们还想进一步确认指定元素在列表中的具体位置，还可以使用 `indexOf`、`indexOfFirst` 和 `indexOfLast` 方法，查找给定值的索引：

```kotlin
roList.indexOf(1)   // 0
roList.indexOf(8)   // -1（表示不存在）
```

## 无重复集合（Set）

```kotlin
val roSet = setOf(1, 2, 3, 4, 5)
val rwSet = mutableSetOf(1, 2, 3, 4, 5)
```

除了列表之外，另一种常用的集合类是无重复集合。叫做这么奇怪的名字是为了和集合类当中的“集合”一词区分，不过，在通常情况下，我们都将其简称为“集合”，或者用其英文名 Set。与列表相同，集合也分为只读（`Set`）和可写（`MutableSet`）两个版本。

动手能力强的读者或许已经开始写出这样的代码……

```kotlin
println(roSet[0])   // 不行！
rwSet[0] = 2        // 不行！
```

这种做法是不行的，因为集合中存储的元素（逻辑上）是**无序的**（尽管有些集合的实现是有序的），这一点与列表不同。在上面的例子中，我们知道 `roSet` 中有 `1, 2, 3, 4, 5` 五个元素，但我们不能谈论“第一个元素是什么”，因为在集合中并没有这样的概念 —— 集合**没有先后次序之分**。

*大家可能会想，列表还能有序存储内容呢，集合如果连这都做不到，那还不如使用列表呢。其实，集合的存在是一种功能和性能的权衡，集合舍弃了列表的有序性，换取了更高的查找和修改性能，这一点会在稍后提到。*

除此之外，集合的全名叫做无重复集合，是因为其中的元素是……**无重复**的！`Set` 和 `MutableSet` 确保其中只包含每种元素最多一个，即使尝试向它们中添加重复的元素，它们也只会简单地忽略掉。这种特性用来存储“哪些玩家已经领取过初始套装”这种信息实在是太合适了。

与列表类似，集合也支持 `add`、`remove` 和 `contains` 方法，分别用于添加、删除和查找元素。不过，由于集合是无序的，因此 `addLast`、`indexOf` 这种方法并不存在（因为根本就没有索引嘛！）。

```kotlin
roList.contains(1)  // true
rwList.remove(2)    // 1, 3, 4, 5（无序）
rwList.add(8)       // 1, 3, 4, 5, 8（无序）
```

## 映射表（Map）

```kotlin
val roMap = mapOf(1 to 2, 3 to 4)
val rwMap = mutableMapOf("cia" to "llo", "hello" to "world")
```

虽然在这里是第一次正式介绍，但我们其实已经使用过映射表了（还记得 MapDB 吗？）。映射表的作用就像字典：你可以将一些**键**对应到一些**值**，稍后只要提供键，就可以取回对应的值。同样，映射表也区分只读和可写的版本。

乍看之下，映射表和列表、集合完全不一样，大家可能会问，“映射表中存储的是一列什么元素呢？”，其实它存储的是一列**键值对**，即一个键和对应的值打包在一起的结构（有点像 Minecraft 中装着潜影盒的箱子）。在上面的例子中，`rwMap` 中有两个元素，分别是 `"ciallo" to "llo"` 和 `"hello" to "world"`。这可不是笔者牵强附会，映射表中的“元素”在 Kotlin 中是有对应的类的，即 `Map.Entry`。

虽说映射表中存储着的是“一列键值对”，然而遗憾的是，这只是一个逻辑上的结构。映射表因其快速查找的能力而广为应用，如果真的用“一列键值对”这种结构，速度会慢得不得了。因此，映射表不能简单使用 `add` 等方法查找其中的“元素”，而必须使用其专门的方法。

映射表几乎唯一的功能就是**读取和修改值**：

```kotlin
println(rwMap["cia"])   // "llo"
rwMap["cia"] = "llo~"
```

和索引访问非常类似，不过在映射表中，`[]` 内需要填入键的值，而不是对应的键在映射表中的位置。（其实，映射表中键值对也没有具体的位置，就像集合那样）

除此之外，我们还可以使用 `contains` 来查找键：

```kotlin
roMap.contains(1)   // true
```

`contains` 还有个变种 `containsValue`，可以用来查找值。（遗憾的是，通常来说 `containsValue` 的速度比较慢）

映射表还提供了 `remove` 方法用来删除键（及其对应的值）：

```kotlin
rwMap.remove(3) // 3 to 4 被删除
```

---

这一节可真长！有关集合类的东西实在是太多，尽管我们只是在介绍最基本的用法，还是免不了要花去一些篇幅的。在下一节中我们将继续这个话题，并让大家感受到 Kotlin 的函数式编程是如何与集合类高效地结合起来的。