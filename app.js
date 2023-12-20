//jshint esversion:6
const baseFolder = process.env.BASE || "todo";
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { name } = require("ejs");
const app = express();
const _ = require("lodash");

mongoose.connect(process.env.DB || "mongodb://localhost:27017/todolistDB");

const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const workItems = [];

app.get("/" + baseFolder, function (req, res) {
  const title = "Today";
  Item.find({}).then(function (items) {
    if (items.length == 0) {
      Item.insertMany(defaultItems);
      res.redirect("/" + baseFolder);
    } else {
      res.render("list", { listTitle: title, newListItems: items });
    }
  });
});

app.post("/" + baseFolder, function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  let newItem = new Item({
    name: itemName,
  });
  if (req.body.list === "Today") {
    newItem.save();
    res.redirect("/" + baseFolder);
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + baseFolder + "/" + listName);
    });
  }
});

app.post("/" + baseFolder + "/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }).then();
    res.redirect("/" + baseFolder);
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then();
    res.redirect("/" + baseFolder + "/" + listName);
  }
});

app.get("/" + baseFolder + "/:custom", function (req, res) {
  const customListName = _.capitalize(req.params.custom);

  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      let list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      Item.insertMany(defaultItems);
      res.redirect("/" + baseFolder + "/" + customListName);
    } else {
      res.render("list", {
        listTitle: customListName,
        newListItems: foundList.items,
      });
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
