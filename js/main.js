// Generated by CoffeeScript 2.4.1
(function() {
  (function($) {
    var InjectionRunner, Node, canvas, commandDictionary, commentChar, ctxt, currentRunner, fieldStarter, goal, highlightLine, iconSpriteSheet, loadJSON, mission, network, nodeChildrenDistance, nodeStarter, rebalanceLines, redraw, renderView, starter, storeChar, valueStarter;
    nodeStarter = '@';
    fieldStarter = '#';
    storeChar = '$';
    valueStarter = [fieldStarter, storeChar];
    commentChar = '%';
    // This represents a virtual node in the Inject.ion network.
    Node = class Node {
      constructor(name, type, fields, links, port = -999) {
        var child;
        this.name = name;
        this.type = type;
        this.fields = fields;
        this.port = port;
        if (this.port == null) {
          this.port = -999;
        }
        this.linksTo = {};
        for (child in links) {
          if (links.hasOwnProperty(child)) {
            this.linksTo[child] = new Node(links[child].name, links[child].type, links[child].fields, links[child].linksTo, links[child].port);
          }
        }
      }

      copy() {
        var deepCopy;
        // Retrieved from Michael Jasper's answer,
        // From https://stackoverflow.com/questions/5364650/cloning-an-object-in-javascript
        deepCopy = JSON.parse(JSON.stringify(this));
        return new Node(deepCopy.name, deepCopy.type, deepCopy.fields, deepCopy.linksTo, deepCopy.port);
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

      // No validation for disparate trees.
      checkAgainst(node) {
        var field, link;
// Compare all fields.
        for (field in this.fields) {
          if (this.fields.hasOwnProperty(field)) {
            console.log(this.fields[field]);
            console.log(node.fields[field]);
            if (this.fields[field] !== node.fields[field]) {
              return false;
            }
          }
        }
// Go to compare all fields of children.
        for (link in this.linksTo) {
          if (this.linksTo.hasOwnProperty(link)) {
            if (!this.linksTo[link].checkAgainst(node.linksTo[link])) {
              return false;
            }
          }
        }
        return true;
      }

    };
    // Contains every single Inject.ion command.
    commandDictionary = {
      // Goes to the following node, carrying a value.
      // Expects 2 parameters, a node, and a value.
      // Validated.
      inject: function(values, env) {
        var compValue, field, link, node, value;
        node = values[0];
        value = values[1];
        // '$' and '~' will do nothing.
        if (node.charAt(0) === nodeStarter && valueStarter.includes(value.charAt(0))) {
          // Validation; function does nothing if field is invalid.
          compValue = 0;
          if (value.charAt(0) === fieldStarter) {
            field = env.tree.followPath(env.path).fields[value.substring(1)];
            if (field != null) {
              compValue = field;
            } else {
              return env;
            }
          } else {
            compValue = env.store;
          }
          // Check for ports.
          link = env.tree.followPath(env.path).linksTo[node.substring(1)];
          if ((link != null) && (link.port === -999 || compValue === link.port)) {
            env.path.push(node.substring(1));
          }
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
      // Expects 1 parameter, a value.
      // Validated.
      return: function(values, env) {
        var compValue, value;
        value = values[0];
        if (env.path.length === 0) {
          return env;
        }
        if (valueStarter.includes(value.charAt(0))) {
          if (value.charAt(0) === fieldStarter) {
            compValue = env.tree.followPath(env.path).fields[value.substring(1)];
            if (compValue != null) {
              env.store = compValue;
            } else {
              return env;
            }
          }
          env.path = env.path.slice(0, env.path.length - 1);
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Sets a field in the node to the value indicated.
      // Expects 2 parameters, a field and a value.
      // Validated.
      set: function(values, env) {
        var actualValue, field, value;
        field = values[0];
        value = values[1];
        if (field.charAt(0) === fieldStarter && valueStarter.includes(value.charAt(0))) {
          if (env.tree.followPath(env.path).fields[field.substring(1)] == null) {
            return env;
          }
          actualValue = 0;
          if (value.charAt(0) === storeChar) {
            actualValue = env.store;
          } else {
            if (env.tree.followPath(env.path).fields[value.substring(1)] != null) {
              actualValue = env.tree.followPath(env.path).fields[value.substring(1)];
            } else {
              return env;
            }
          }
          env.tree.followPath(env.path).fields[field.substring(1)] = actualValue;
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Adds a field to store.
      // Expects 1 parameter, a field.
      //Validated.
      add: function(values, env) {
        var compValue, field;
        field = values[0];
        if (field.charAt(0) === fieldStarter) {
          compValue = env.tree.followPath(env.path).fields[field.substring(1)];
          if (compValue != null) {
            env.store += env.tree.followPath(env.path).fields[field.substring(1)];
          }
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Subtracts a field from store.
      // Expects 1 parameter, a field.
      // Validated.
      sub: function(values, env) {
        var compValue, field;
        field = values[0];
        if (field.charAt(0) === fieldStarter) {
          compValue = env.tree.followPath(env.path).fields[field.substring(1)];
          if (compValue != null) {
            env.store -= env.tree.followPath(env.path).fields[field.substring(1)];
          }
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Inverts store.
      // Expects 0 parameters.
      // Validated.
      invert: function(values, env) {
        env.store = -env.store;
        console.log(JSON.stringify(env));
        return env;
      },
      // Marks a jumping point.
      // Expects 1 parameter, a string.
      // Validated.
      mark: function(values, env) {
        var string;
        string = values[0];
        if (string.match(/[^A-Z]/i) == null) {
          env.marks[string] = env.line;
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Jumps to a marked point.
      // Expects two parameters, a conditional, and a string.
      jump: function(values, env) {
        var comparison, jumpDestination, l_comp, leftComparator, outcome, r_comp, rightComparator;
        leftComparator = values[0];
        comparison = values[1];
        rightComparator = values[2];
        jumpDestination = values[3];
        if (valueStarter.includes(leftComparator.charAt(0)) && valueStarter.includes(rightComparator.charAt(0))) {
          if (leftComparator.charAt(0) === fieldStarter) {
            l_comp = env.tree.followPath(env.path).fields[leftComparator.substring(1)];
            if (l_comp != null) {
              leftComparator = l_comp;
            } else {
              return env;
            }
          } else {
            leftComparator = env.store;
          }
          if (rightComparator.charAt(0) === fieldStarter) {
            r_comp = env.tree.followPath(env.path).fields[rightComparator.substring(1)];
            if (r_comp != null) {
              rightComparator = r_comp;
            } else {
              return env;
            }
          } else {
            rightComparator = env.store;
          }
        }
        outcome = false;
        switch (comparison) {
          case '!':
            outcome = leftComparator !== rightComparator;
            break;
          case '=':
            outcome = leftComparator === rightComparator;
            break;
          case '>':
            outcome = leftComparator > rightComparator;
            break;
          case '<':
            outcome = leftComparator < rightComparator;
        }
        if (outcome && (jumpDestination.match(/[^A-Z]/i) == null)) {
          env.line = env.marks[jumpDestination];
        }
        console.log(JSON.stringify(env));
        return env;
      },
      // Skips a number of lines.
      // Expects two parameters, a conditional, and an integer.
      skip: function(values, env) {
        var comparison, l_comp, leftComparator, outcome, r_comp, rightComparator, skips;
        leftComparator = values[0];
        comparison = values[1];
        rightComparator = values[2];
        skips = values[3];
        if (valueStarter.includes(leftComparator.charAt(0)) && valueStarter.includes(rightComparator.charAt(0))) {
          if (leftComparator.charAt(0) === fieldStarter) {
            l_comp = env.tree.followPath(env.path).fields[leftComparator.substring(1)];
            if (l_comp != null) {
              leftComparator = l_comp;
            } else {
              return env;
            }
          } else {
            leftComparator = env.store;
          }
          if (rightComparator.charAt(0) === fieldStarter) {
            r_comp = env.tree.followPath(env.path).fields[rightComparator.substring(1)];
            if (r_comp != null) {
              rightComparator = r_comp;
            } else {
              return env;
            }
          } else {
            rightComparator = env.store;
          }
        }
        outcome = false;
        switch (comparison) {
          case '!':
            outcome = leftComparator !== rightComparator;
            break;
          case '=':
            outcome = leftComparator === rightComparator;
            break;
          case '>':
            outcome = leftComparator > rightComparator;
            break;
          case '<':
            outcome = leftComparator < rightComparator;
        }
        if (outcome && (skips.match(/[^0-9]/i) == null)) {
          env.line += parseInt(skips);
        }
        console.log(JSON.stringify(env));
        return env;
      }
    };
    // Forgive me, codemasters, but I need to insert the view into this model class, just this once.
    canvas = document.getElementById('env_view');
    ctxt = canvas.getContext('2d');
    // Load ALL assets.
    starter = null;
    goal = null;
    mission = null;
    network = null;
    currentRunner = null;
    loadJSON = function(file) {
      return $.getJSON(file).done(function(data) {
        starter = data.startingTree;
        goal = data.completeTree;
        mission = data.mission;
        starter = new Node(starter.name, starter.type, starter.fields, starter.linksTo, starter.port);
        network = starter.copy();
        $('#mission_text').text(mission);
        currentRunner = new InjectionRunner;
        currentRunner.load(null, network);
        return redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().store);
      });
    };
    iconSpriteSheet = new Image();
    iconSpriteSheet.onload = function() {
      return loadJSON('https://api.myjson.com/bins/p4a1e');
    };
    //loadJSON('levels/level1.json')
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
      if (node.port === -999) {
        ctxt.fillText('@' + node.name, x, y + 100 + 20, 200);
      } else {
        ctxt.fillText('@' + node.name + ":" + node.port, x, y + 100 + 20, 200);
      }
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
    redraw = function(node, path, store) {
      ctxt.clearRect(0, 0, canvas.width, canvas.height);
      if (path.length === 0) {
        return renderView(node, [node.name], store, 50, 50, 0, 90);
      } else {
        return renderView(node, path, store, 50, 50, 0, 90);
      }
    };
    // Adjust canvas bounds on resize, and redraw contents.
    window.addEventListener('resize', function(event) {
      ctxt.canvas.width = window.innerWidth - 325;
      ctxt.canvas.height = window.innerHeight - 50;
      return redraw(currentRunner.env().tree, currentRunner.env().path, currentRunner.env().store);
    });
    // Set canvas bounds.
    ctxt.canvas.width = window.innerWidth - 325;
    ctxt.canvas.height = window.innerHeight - 50;
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
          env.marks = {};
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

        redraw() {
          return redraw(env.tree, env.path, env.store);
        }

      };

      env = {
        store: 0,
        marks: {},
        line: 0,
        path: [],
        tree: null
      };

      runLine = function(line) {
        var lexemes;
        lexemes = line.split(' ');
        env = commandDictionary[lexemes[0]](lexemes.slice(1), env);
        return redraw(env.tree, env.path, env.store);
      };

      return InjectionRunner;

    }).call(this);
    rebalanceLines = function() {
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
          results.push($('#line_numbers').append('<li class=\'line_num\' id=\'line' + ($('.line_num').length + 1) + '\'>' + ($('.line_num').length + 1) + '</li>'));
        }
        return results;
      } else if (numNewLines < $('.line_num').length) {
        results1 = [];
        while ($('.line_num').length > numNewLines) {
          results1.push($('#line_numbers > li').last().remove());
        }
        return results1;
      }
    };
    highlightLine = function(prev, curr) {
      if (prev != null) {
        $('#line' + prev).css('background-color', 'transparent');
      }
      return $('#line' + curr).css('background-color', '#FFB8DA');
    };
    // Adjusts line numbers.
    $('#injection_code').bind('input', function(event) {
      return rebalanceLines();
    });
    // Selects a new level.
    $('.level').click(function(event) {
      //loadJSON('https://api.myjson.com/bins/pv2jm')
      loadJSON('levels/' + event.target.id + '.json');
      $('#injection_run_line').prop('disabled', false);
      $('#injection_run_all').prop('disabled', false);
      return $('#injection_code').prop('disabled', false);
    });
    $('#injection_reset_env').click(function(event) {
      event.preventDefault();
      $('#line' + currentRunner.env().line).css('background-color', 'transparent');
      currentRunner.eraseAll();
      network = starter.copy();
      console.log(network);
      console.log(starter);
      currentRunner.load(null, network);
      $('#injection_run_line').prop('disabled', false);
      $('#injection_run_all').prop('disabled', false);
      $('#injection_code').prop('disabled', false);
      return currentRunner.redraw();
    });
    $('#injection_run_line').click(function(event) {
      var prevLine;
      event.preventDefault();
      prevLine = null;
      $('#injection_run_all').prop('disabled', true);
      $('#injection_code').prop('disabled', true);
      if (currentRunner.isEmpty()) {
        currentRunner.load($('#injection_code').val(), network);
      } else {
        prevLine = currentRunner.env().line;
      }
      currentRunner.runNext();
      return highlightLine(prevLine, currentRunner.env().line);
    });
    $('#injection_run_all').click(function(event) {
      event.preventDefault();
      $('#injection_run_line').prop('disabled', true);
      $('#injection_run_all').prop('disabled', true);
      $('#injection_code').prop('disabled', true);
      currentRunner.load($('#injection_code').val(), network);
      currentRunner.runAll();
      if (network.checkAgainst(goal)) {
        return $('#win_container').fadeIn(300);
      }
    });
    $('#open_manual').click(function(event) {
      event.preventDefault();
      return $('#reference_manual').fadeIn(500);
    });
    $('#close_manual').click(function(event) {
      event.preventDefault();
      return $('#reference_manual').fadeOut(500);
    });
    // On init:
    return rebalanceLines();
  })(jQuery);

}).call(this);
