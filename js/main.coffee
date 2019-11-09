(($) ->
  commandDictionary =

    # Goes to the following node, carrying a value.
    # Expects 2 parameters, a node, and a value.
    inject: (values) ->
      console.log('Hello!')

    # Returns to the node's parrent, carrying the value of the field indicated.
    # Expects 1 parameter, a field.
    return: (values) ->

    # Sets a field in the node to the value indicated.
    # Expects 2 parameters, a field and a value.
    set: (values) ->

  class Node
    constructor: (@name, @fields, @linksTo) ->

    displayName: ->
      console.log(@name)

  class InjectionRunner
    constructor: (@code) ->

    runLine: (line) ->
      lexemes = line.split(' ')
      commandDictionary[lexemes[0]] -> lexemes.slice(1)


  runnertest = new InjectionRunner('inject 3').runLine('inject 3')
  $ -> console.log('We are live!')
) jQuery
