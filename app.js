//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
const database = process.env.DB;
app.use(express.static("public"));
mongoose.connect(database, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Input text and hit '+' to add a new item"
});
const item2 = new Item({
  name: "Hit the checkbox to delete the item"
});
const item3 = new Item({
  name: "Append '/Title' to the URL to generate or go to the list with specified title"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, results) {
    if (results.length ===0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success inserted initial");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: 'Today',
        newListItems: results
      });
    }

  });


});

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;
  const itemDoc = new Item({
    name: item
  });
  if (listName === "Today") {
    itemDoc.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(itemDoc);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName ==="Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name:listName}, {$pull:{items:{_id: checkedItemId}}}, function(err, results) {
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }
})

app.get("/:paramName", function(req, res) {
  const listName = _.capitalize(req.params.paramName);
  List.findOne({name: listName}, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: results.name,
          newListItems: results.items
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started");
});
