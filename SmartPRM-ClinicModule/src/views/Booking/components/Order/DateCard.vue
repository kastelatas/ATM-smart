<template>
  <div class="px-2">
    <div class="app-border pt-2 date-card overflow-hidden active-element"
    :class="{'disabled': (!!aviability), 'active': (!!active)}"
    @click="$emit('date-selected', date)"
    >
      <div class="px-3">
        <p class="app-font-small mb-0">{{day}}</p>
        <hr class="my-1" />
        <h1>{{date.getDate()}}</h1>
        <hr class="my-1"/>
        <p class="app-font-small mb-0">{{month}}</p>
      </div>
      <div class="price-field">
        {{(!aviability) ? `$${totalPrice}`: aviability}}
      </div>
    </div>
  </div>
</template>

<script>
import { getDayOfWeek, getMonthName } from '@/Utils/appDate'

export default {
  props: {
    date: Date,
    aviability: [String, Boolean],
    active: Boolean,
    totalPrice: Number
  },
  computed: {
    day: function () {
      return getDayOfWeek(this.date)
    },
    month: function () {
      return getMonthName(this.date)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/assets/scss/app-vars.scss";
.date-card{
  color: $black;
  border-color: $gray-800;
  transition: background-color 0.35s linear;
  &.disabled{
    color: unset;
    border-color: unset;
    .price-field{
      background-color: $gray-600;
    }
    h1{
      color: $gray-600;
    }
  }
  &.active:not(.disabled){
    background-color: $primary-10;
    border-color: $primary;
    h1{
      color: $primary;
    }
    .price-field{
      background-color: $primary;
    }
  }
  &.active.disabled{
    background-color: $gray-100;
    h1{
      color: $gray-700;
    }
  }
  h1{
    line-height: 3rem;
  }
  .price-field{
    color: $white;
    background-color: $gray-800;
  }
}
</style>
