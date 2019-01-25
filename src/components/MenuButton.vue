<template>
  <span :class="'menu-button theme-' + theme">
    <button
      ref="mbutton"
      class="icon"
      @blur="onMenuButtonBlur"
      @click="menuSelect()">
      <svg><use xlink:href="dist/symbols.svg#menu"><title>{menuTitle}</title></use></svg>
    </button>
    <div
      v-if="toggled"
      :class="'menu ' + menuAlign"
      ref="menu"
    >
      <span
        v-for="item in items"
        :key="item.value"
        @click="itemSelect(item)"
        :class="(selected.includes(item.value) ? 'menu-item selected' : 'menu-item') + (item.isNew ? ' new-group' : '')"
      >{{item.label}}</span>
    </div>
  </span>
</template>

<script>
  export default {

    name: 'MenuButton',

    props: {
      items: Array,
      menuAlign: {
        type: String,
        default: 'bl'
      },
      menuPadding: {
        type: Number,
        default: 5
      },
      menuTitle: {
        type: String,
        default: 'Menu'
      },
      theme: {
        type: String,
        default: 'light'
      },
      selected: Array
    },

    data() {
      return {
        toggled: false
      }
    },

    methods: {
      menuSelect() {
        //console.log(`MenuButton.menuSelect()`);
        this.toggled = !this.toggled;
      },
      itemSelect(item) {
        //console.log(`MenuButton.itemSelect() ${item.label}`);
        this.$emit('select', item.value);
      },
      onMenuButtonBlur() {
        //console.log(`MenuButton.onMenuButtonBlur()`);
        setTimeout(() => this.toggled = false, 200);
      }
    }

  }
</script>

<style lang="scss" scoped>
  .menu-button {
    position: relative;
    right: 50px;
    > button {
      position: absolute;
    }
  }
  .menu {
    position: absolute;
    min-width: 200px;
    padding: 2px;
    .menu-item {
      display: block;
      padding: 10px;
      cursor: pointer;
      width: 100%;
    }
    .menu-item.new-group {
      border-top: white solid 1px;
    }
  }
  .theme-dark {
    fill: white;
    color: white;
    button:focus {
      outline: none;
    }
    .menu {
      background-color: #333;
      border: #000 solid 1px;
    }
    .menu.br {
      top: 50px;
      right: 0;
      > * {
        float: right;
      }
    }
    .menu-item {
      &:hover {
        background-color: rgba(255,255,255,0.3);
      }
      &.selected {
        background-color: rgba(127,127,255,0.2);
      }
    }
  }
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    .menu {
      min-width: 300px;
    }
  }
</style>
