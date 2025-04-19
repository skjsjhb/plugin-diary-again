import { useState } from "react";

export function RandomPackageName() {
    const [name, setName] = useState(makeName())

    function createRandomString(length) {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function makeName() {
        const a = createRandomString(Math.ceil(Math.random() * 6) + 2)
        const b = createRandomString(Math.ceil(Math.random() * 6) + 2)
        return `${a}.mc.plugins.${b}`
    }

    return <code onClick={() => setName(makeName())}>{name}</code>;
}