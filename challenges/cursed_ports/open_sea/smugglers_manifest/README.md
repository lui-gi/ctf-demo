# The Smuggler's Manifest

Old Quill Calderwood ran the cleanest smuggling ring in the Crescent — *too* clean. Customs men never found a thing on his ships. We learned why when we cracked his back-office: the man kept his entire cargo manifest in a Mongo collection behind a public search endpoint, and every dockhand in his crew used the same lookup tool to find their assigned crates.

The endpoint accepts a `name` parameter and returns matching cargo entries. Standard JSON in, standard JSON out. Calderwood thought he was clever: he marked his most sensitive entries as `hidden:true` and filtered them out of normal search results. He never imagined someone would *talk back* to his database in a language it understood.

Find the hidden manifest entry. The Treasure is the value of its `treasure` field.

**Endpoint:** {provided at Voyage start}
