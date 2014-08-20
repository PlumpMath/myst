var Syntax = require('./parserScope');
var prelude = require('../prelude');
var preludeImports = Object.keys(prelude).map(function(str) {
  return { type: 'Identifier', name: str };
});

var uniqueId = require('./ast').uniqueId;

var desugarers = {
  Literal: function(literal) { return [0, literal]; },

  Identifier: function(identifier) { return [0, identifier]; },

  Program: function(program) {
    return [0, Syntax.Program(desugar(program.body))];
  },

  Declaration: function(declaration, state) {
    switch (state) {
      case 1:
        if (Syntax.isFunctionBind(declaration.target)) {
          return [2, Syntax.Declaration(
            declaration.target.name,
            [Syntax.Lambda(
              declaration.target.parameters,
              declaration.value
            )]
          )];
        } else if (Syntax.isObjectDestructure(declaration.target)) {
          var uid = uniqueId();
          var decls = [Syntax.Declaration(uid, declaration.value)];
          decls = decls.concat(declaration.target.properties.map(function(property) {
            return Syntax.Declaration(
              property.as,
              [ Syntax.Member(uid, property.property) ]
            );
          }));
          return [0, desugar(decls)];
        } else if (Syntax.isArrayDestructure(declaration.target)) {
          var uid = uniqueId();
          var decls = [Syntax.Declaration(uid, declaration.value)];
          decls = decls.concat(declaration.target.items.map(function(item, i) {
            return Syntax.Declaration(
              item,
              [ Syntax.Member(uid, i) ]
            );
          }));
          return [0, desugar(decls)];
        }
      case 2:
        return [0, Syntax.Declaration(desugar(declaration.target), desugar(declaration.value))];
    }

    console.log(state);
    throw new Error('Invalid State');
  },

  FunctionBind: function() { throw new Error('Invalid FunctionBind'); },

  ObjectDestructure: function() { throw new Error('Invalid ObjectDestructure'); },

  PropertyDestructure: function() { throw new Error('Invalid PropertyDestructure'); },

  ArrayDestructure: function() { throw new Error('Invalid ArrayDestructure'); },

  Operation: function(operation) {
    return [1, Syntax.Invocation(
      Syntax.Identifier(operation.name),
      [operation.fst, operation.snd]
    )];
  },

  Invocation: function(invocation, state) {
    switch (state) {
      case 1:
        if (invocation.arguments.some(Syntax.isPlaceholder)) {
          var uids = [];
          var args = invocation.arguments.map(function(argument) {
            if (Syntax.isPlaceholder(argument)) {
              var uid = uniqueId();
              uids.push(uid);
              return uid;
            }
            return argument;
          });

          return [0, Syntax.Lambda(
            uids,
            Syntax.Invocation(invocation.callee, args)
          )];
        } else {
          return [2, invocation];
        }
      case 2:
        return [0, Syntax.Invocation(
          desugar(invocation.callee), 
          desugar(invocation.arguments))];
    }

    throw new Error('Invalid State');
  },

  Placeholder: function() { throw new Error('Invalid Placeholder'); },

  Lambda: function(lambda, state) {
    switch (state) {
      case 1: // Move destructures into body as assignments
        var destructures = [];
        var parameters = lambda.parameters.map(function(parameter) {
          if (/Destructure/.test(parameter.type)) {
            var uid = uniqueId();
            destructures.push(Syntax.Declaration(parameter, [uid]));
            return uid;
          }
          return parameter;
        });

        return [2, Syntax.Lambda(parameters, destructures.concat(lambda.body))];

      case 2: // Decend
        return [0, Syntax.Lambda(desugar(lambda.parameters), desugar(lambda.body))];
    }

    throw new Error('Invalid State');
  },

  Member: function(member) {
    return [1, Syntax.Invocation(
      Syntax.Identifier('get'),
      [
        member.object,
        Syntax.Literal(member.property)
      ]
    )];
  },

  Object: function(object) {
    return [1, Syntax.Invocation(
      Syntax.Identifier('object'), // TODO: Maybe we don't want this?
      object.properties.map(function(property) {
        return [property.key, property.value];
      }).reduce(function(a, b) { return a.concat(b); })
    )];
  },

  Array: function(array) {
    return [1, Syntax.Invocation(
      Syntax.Identifier('array'),
      array.items
    )];
  }
};

function flatten(list) {
  var newList = [];

  list.forEach(function(i) {
    if (Array.isArray(i))
      newList = newList.concat(i);
    else
      newList.push(i);
  });

  return newList;
}

function desugar(ast) {
  if (Array.isArray(ast)) // Desugar every element of an array
    return flatten(ast.map(desugar));

  var c = 0, s = 1;
  while (s) {
    if (! desugarers.hasOwnProperty(ast.type))
      throw new Error('No desugarer for type: ' + ast.type + ' on node: ' + ast);

    var r = desugarers[ast.type](ast, s);
    s = r[0], ast = r[1];

    if (c++ > 1000) throw new Error('Desugar ' + ast.type + ' not done after 1000 iterations');
  }

  return ast;
}

module.exports = {
  desugar: desugar
};

