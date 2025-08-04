import { findAndReplace } from "mdast-util-find-and-replace"

export default function replaceQuotes() {

    return function (tree) {
        findAndReplace(tree, [
            ["“", "『"],
            ["”", "』"],
             ["‘", "「"],
            ["’", "」"]
        ]);
    }
}