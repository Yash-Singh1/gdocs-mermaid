<template>
  <Menu as="div" class="relative">
    <MenuButton class="btn mb-0 px-2 py-1 border border-silver" type="button">
      {{ name }}
    </MenuButton>
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        class="absolute left-0 mt-1 ml-1 w-max box-content origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
      >
        <MenuItem v-for="item in items">
          <button
            class="btn m-0 rounded-none text-left justify-start font-semibold pr-5"
            @click="emit('click', item.id)"
          >
            {{ item.name }}
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { MenuButton, MenuItems, MenuItem, Menu } from '@headlessui/vue';

defineProps<{
  name: string;
  items: {
    name: string;
    id: string;
  }[];
}>();
const emit = defineEmits<{
  (e: 'click', id: string): void;
}>();
</script>

<style scoped></style>
