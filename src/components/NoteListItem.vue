<template>
  <li @click="itemSelect()">
    <span class="title">{{note.name}}</span><br/>
    <span class="date">{{note.Created_date ? $moment(note.Created_date.toDate()).format('ddd l h:mm:ss a') : ''}}</span>
    <span v-if="!note.place || !note.place.name" class="geocoords" @click="itemMapSelect">
          <svg class="icon-tiny location-icon"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
          {{(note.geocode.latitude ? note.geocode.latitude.toFixed(5) : 'Unknown') + ', ' + (note.geocode.longitude ? note.geocode.longitude.toFixed(5) : 'Unknown')}}
        </span>
    <span v-if="note.place && note.place.name" class="place">
          <svg class="icon-tiny place-icon"><use xlink:href="dist/symbols.svg#place"></use></svg>
          {{note.place.name}}
        </span>
    <br clear="all"/>
    <span class="note">{{(note.note && note.note.length > 84) ? note.note.substr(0,84) + '...' : note.note}}</span>
  </li>
</template>

<script>
  export default {

    props: {
      note: Object
    },

    data() {
      return {}
    },

    methods:{

      itemSelect() {
        //console.log(`NoteListItem.itemSelect()`);
        this.$emit('select', this.note);
      },

      itemMapSelect(e) {
        //console.log(`NoteListItem.itemMapSelect()`);
        e.stopPropagation();
        this.$emit('mapselect', this.note);
      }

    }

  }
</script>

<style lang="scss" scoped>
  li {
    margin: 0;
    list-style: none;
    width: 100%;
    background-color: #ffffff;
    padding: 10px 20px;
    text-align: left;
    cursor: pointer;
  }
  li span {
    display: inline-block;
  }
  .date, .note {
    font-size: smaller;
  }
  .title {
    margin-bottom: 8px;
  }
  .note {
    margin-top: 8px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords, .place {
    float: right;
    font-size: smaller;
    width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .geocoords {
    color: #4e7eef;
  }
  .location-icon {
    fill: #4e7eef;
  }
  .place {
    color: #666;
  }
  .place-icon {
    fill: #ed453b;
  }
</style>
