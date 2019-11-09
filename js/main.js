// Generated by CoffeeScript 2.4.1
(function() {
  (function($) {
    var InjectionRunner, Node, commandDictionary;
    // Contains every single Inject.ion command.
    commandDictionary = {
      // Goes to the following node, carrying a value.
      // Expects 2 parameters, a node, and a value.
      inject: function(values, env) {
        var node, value;
        node = values[0];
        value = values[1];
        console.log('inj');
        return env;
      },
      // Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
      // Expects 1 parameter, a field.
      return: function(values, env) {
        var field;
        field = values[0];
        console.log('ret');
        return env;
      },
      // Sets a field in the node to the value indicated.
      // Expects 2 parameters, a field and a value.
      set: function(values, env) {
        var field, value;
        field = values[0];
        value = values[1];
        console.log(env.store);
        return env;
      },
      // Stores a field into memory.
      // Expects 1 parameters, a field.
      store: function(values, env) {
        var field;
        field = values[0];
        env.store = field;
        return env;
      }
    };
    // This represents a virtual node in the Inject.ion network.
    Node = class Node {
      constructor(name, fields, linksTo) {
        this.name = name;
        this.fields = fields;
        this.linksTo = linksTo;
      }

      displayName() {
        return console.log(this.name);
      }

    };
    InjectionRunner = (function() {
      var env, runLine;

      // This creates a rudimentary environment for the Inject.ion code.
      class InjectionRunner {
        constructor(code) {
          this.code = code;
        }

        run(tree) {
          var results, splitLines;
          env.tree = tree;
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
        tree: null
      };

      runLine = function(line) {
        var lexemes;
        lexemes = line.split(' ');
        return env = commandDictionary[lexemes[0]](lexemes.slice(1), env);
      };

      return InjectionRunner;

    }).call(this);
    return $('#injection_run').click(function(event) {
      var runner;
      event.preventDefault();
      runner = new InjectionRunner($('#injection_code').val());
      return runner.run('test');
    });
  })(jQuery);

}).call(this);
