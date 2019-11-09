// Generated by CoffeeScript 2.4.1
(function() {
  (function($) {
    var InjectionRunner, Node, canvas, commandDictionary, ctxt, currentRunner, fieldStarter, iconSpriteSheet, network, nodeChildrenDistance, nodeStarter, nullChar, redraw, renderView, storeChar, valueStarter;
    nodeStarter = '@';
    fieldStarter = '#';
    storeChar = '$';
    nullChar = '~';
    // '$' refers to the store value; '~' refers to NULL.
    valueStarter = [fieldStarter, storeChar, nullChar];
    // This represents a virtual node in the Inject.ion network.
    Node = class Node {
      constructor(name, type, fields, links) {
        var child;
        this.name = name;
        this.type = type;
        this.fields = fields;
        this.linksTo = {};
        for (child in links) {
          if (links.hasOwnProperty(child)) {
            this.linksTo[child] = new Node(links[child].name, links[child].type, links[child].fields, links[child].linksTo);
          }
        }
      }

      followPath(path) {
        var currentNode;
        currentNode = this;
        if (path.length !== 0) {
          currentNode = this.linksTo[path[0]];
          return currentNode.followPath(path.slice(1));
        }
        return currentNode;
      }

    };
    // Contains every single Inject.ion command.
    commandDictionary = {
      // Goes to the following node, carrying a value.
      // Expects 2 parameters, a node, and a value.
      inject: function(values, env) {
        var node, value;
        node = values[0];
        value = values[1];
        // '$' and '~' will do nothing.
        if (node.charAt(0) === nodeStarter && valueStarter.includes(value.charAt(0))) {
          if (value.charAt(0) === fieldStarter) {
            env.store = env.tree.followPath(env.path).fields[value.substring(1)];
          }
          env.path.push(node.substring(1));
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
      // Expects 1 parameter, a value.
      return: function(values, env) {
        var field;
        field = values[0];
        if (field.charAt(0) === fieldStarter) {
          env.store = env.tree.followPath(env.path).fields[field.substring(1)];
          env.path = env.path.slice(0, env.path.length - 1);
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Sets a field in the node to the value indicated.
      // Expects 2 parameters, a field and a value.
      set: function(values, env) {
        var actualValue, field, value;
        field = values[0];
        value = values[1];
        if (field.charAt(0) === fieldStarter && valueStarter.includes(value.charAt(0))) {
          actualValue = 0;
          if (value.charAt(0) === storeChar) {
            actualValue = env.store;
          } else if (value.charAt(0) === fieldStarter) {
            actualValue = env.tree.followPath(env.path).fields[value.substring(1)];
          }
          env.tree.followPath(env.path).fields[field.substring(1)] = actualValue;
        }
        console.log(JSON.stringify(env));
        return env;
      }
    };
    // Forgive me, codemasters, but I need to insert the view into this model class, just this once.
    canvas = document.getElementById('env_view');
    ctxt = canvas.getContext('2d');
    // Load ALL assets.
    network = null;
    currentRunner = null;
    iconSpriteSheet = new Image();
    iconSpriteSheet.onload = function() {
      return $.getJSON('https://api.myjson.com/bins/uu92s').done(function(data) {
        network = new Node(data.name, data.type, data.fields, data.linksTo);
        currentRunner = new InjectionRunner;
        currentRunner.load(null, network);
        return redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().store, 50, 50);
      });
    };
    iconSpriteSheet.src = 'img/icon_spritesheet.png';
    // Distance in pixels between a node and its children.
    nodeChildrenDistance = 300;
    // End asset loading.

    // Renders a view of the network.
    // node: the network node to draw.
    // x: the x-location to draw the node at.
    // y: the y-location to draw the node at.
    // s_range: the start of the angle range this node can draw its children on.
    // e_range: the end of the angle range this node can draw its children on.
    renderView = function(node, path, store, x, y, s_range, e_range) {
      var child, colorOffset, currentChild, drawAngle, end_x, end_y, field, isCurrentNode, new_e_range, new_s_range, numChildren, offset, results;
      colorOffset = 0;
      isCurrentNode = false;
      if (path[path.length - 1] === node.name) {
        colorOffset = 240;
        isCurrentNode = true;
      }
      if (node.type === 'console') {
        ctxt.drawImage(iconSpriteSheet, 0, colorOffset, 240, 240, x, y, 100, 100);
      } else if (node.type === 'server') {
        ctxt.drawImage(iconSpriteSheet, 480, colorOffset, 240, 240, x, y, 100, 100);
      } else if (node.type === 'computer') {
        ctxt.drawImage(iconSpriteSheet, 240, colorOffset, 240, 240, x, y, 100, 100);
      }
      ctxt.font = '20px Fira Code';
      ctxt.fillText('@' + node.name, x, y + 100 + 20, 200);
      ctxt.font = '15px Fira Code';
      offset = 135;
      for (field in node.fields) {
        if (node.fields.hasOwnProperty(field)) {
          ctxt.fillText('#' + field + ' → ' + node.fields[field], x + 5, y + offset, 200);
          offset += 15;
        }
      }
      if (isCurrentNode) {
        ctxt.fillStyle = '#FF3797';
        ctxt.fillText('$' + ' → ' + store, x + 5, y + offset, 200);
        ctxt.fillStyle = 'black';
      }
      if (Object.keys(node.linksTo).length > 0) {
        numChildren = Object.keys(node.linksTo).length;
        currentChild = 1;
        results = [];
        for (child in node.linksTo) {
          if (node.linksTo.hasOwnProperty(child)) {
            drawAngle = ((e_range - s_range) / (numChildren + 1)) * currentChild * 0.01745329;
            new_s_range = s_range + ((e_range - s_range) / numChildren) * (currentChild - 1);
            new_e_range = new_s_range + ((e_range - s_range) / numChildren);
            end_x = x + nodeChildrenDistance * Math.cos(drawAngle);
            end_y = y + nodeChildrenDistance * Math.sin(drawAngle);
            ctxt.beginPath();
            ctxt.moveTo(x + 50, y + 50);
            ctxt.lineTo(end_x + 50, end_y + 50);
            ctxt.lineWidth = 5;
            ctxt.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctxt.stroke();
            renderView(node.linksTo[child], path, store, end_x, end_y, new_s_range, new_e_range);
            results.push(currentChild += 1);
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };
    redraw = function(node, path, store, x, y) {
      ctxt.clearRect(0, 0, canvas.width, canvas.height);
      if (path.length === 0) {
        return renderView(node, [node.name], store, x, y, 0, 90);
      } else {
        return renderView(node, path, store, x, y, 0, 90);
      }
    };
    // Adjust canvas bounds on resize, and redraw contents.
    window.addEventListener('resize', function(event) {
      ctxt.canvas.width = window.innerWidth - 325;
      ctxt.canvas.height = window.innerHeight;
      return redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().path, 50, 50);
    });
    // Set canvas bounds.
    ctxt.canvas.width = window.innerWidth - 325;
    ctxt.canvas.height = window.innerHeight;
    InjectionRunner = (function() {
      var env, runLine;

      // End View, resume Model.

      // This creates a rudimentary environment for the Inject.ion code.
      class InjectionRunner {
        constructor() {
          this.code = null;
        }

        env() {
          return env;
        }

        eraseAll() {
          env.store = 0;
          env.line = 0;
          env.path = [];
          env.tree = null;
          return this.code = null;
        }

        isEmpty() {
          return this.code == null;
        }

        load(code, tree) {
          this.code = code;
          return env.tree = tree;
        }

        runNext() {
          var splitLines;
          splitLines = this.code.split('\n');
          return runLine(splitLines[env.line++]);
        }

        runAll() {
          var results, splitLines;
          splitLines = this.code.split('\n');
          results = [];
          while (env.line < splitLines.length) {
            results.push(runLine(splitLines[env.line++]));
          }
          return results;
        }

      };

      env = {
        store: 0,
        line: 0,
        path: [],
        tree: null
      };

      runLine = function(line) {
        var lexemes;
        lexemes = line.split(' ');
        env = commandDictionary[lexemes[0]](lexemes.slice(1), env);
        return redraw(env.tree, env.path, env.store, 50, 50);
      };

      return InjectionRunner;

    }).call(this);
    // Adjusts line numbers.
    $('#injection_code').bind('input', function(event) {
      var character, i, len, numNewLines, ref, results, results1;
      numNewLines = 1;
      ref = $('#injection_code').val();
      for (i = 0, len = ref.length; i < len; i++) {
        character = ref[i];
        if (character === '\n') {
          numNewLines += 1;
        }
      }
      if (numNewLines > $('.line_num').length) {
        results = [];
        while ($('.line_num').length < numNewLines) {
          results.push($('#line_numbers').append('<li class=\'line_num\'>' + ($('.line_num').length + 1) + '</li>'));
        }
        return results;
      } else if (numNewLines < $('.line_num').length) {
        results1 = [];
        while ($('.line_num').length > numNewLines) {
          results1.push($('#line_numbers > li').last().remove());
        }
        return results1;
      }
    });
    $('#injection_reset_env').click(function(event) {
      return currentRunner.eraseAll();
    });
    $('#injection_run_line').click(function(event) {
      event.preventDefault();
      if (currentRunner.isEmpty()) {
        currentRunner.load($('#injection_code').val(), network);
      }
      return currentRunner.runNext();
    });
    return $('#injection_run_all').click(function(event) {
      event.preventDefault();
      currentRunner.load($('#injection_code').val(), network);
      return currentRunner.runAll();
    });
  })(jQuery);

}).call(this);
