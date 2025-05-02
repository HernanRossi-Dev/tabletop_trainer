import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import suidPlugin from "@suid/vite-plugin";
import solid from 'vite-plugin-solid' // or solid-start/vite

import devtools from 'solid-devtools/vite'


export default defineConfig({
  plugins: [suidPlugin(), solidPlugin(),
    devtools({
      /* features options - all disabled by default */
      autoname: true, // e.g. enable autoname
    }),
    solid(),
  ],
  build: {
    target: "esnext",
  },
})